const { User } = require("../models/User")
const { Room } = require("../models/Room")
const bcrypt = require("bcryptjs")
const { set } = require("mongoose")

const activeGames = {}

const TICK_RATE = 25 // ms, ~33Hz
const TURN_DURATION = 10000 // 10s örnek tur süresi
const TURN_WAIT = 5000 // 5s tur arası bekleme

function gameSockets(io, fastify) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token
            if (!token) return next(new Error("Authentication error"))

            // fastify-jwt verify
            const decoded = fastify.jwt.verify(token)
            socket.user = decoded // userId, username
            next()
        } catch (err) {
            next(new Error("Authentication error"))
        }
    })

    io.on("connection", socket => {
        console.log("🔌 Client connected:", socket.user.username)
        // Odaya katıl
        socket.on("joinRoom", async ({ roomCode, password }) => {
            try {
                const user = await User.findById(socket.user.userId)
                if (!user) return

                const room = await Room.findOne({ code: roomCode })
                if (!room) {
                    socket.emit("errorMessage", "Room not found")
                    return
                }

                // Şifre kontrolü gerekiyorsa aç
                // if (room.password) {
                //   const isMatch = await bcrypt.compare(password || "", room.password)
                //   if (!isMatch) {
                //     socket.emit("errorMessage", "Invalid room password")
                //     return
                //   }
                // }

                // Kullanıcıyı players listesine ekle (duplicate engellenir)
                await Room.updateOne({ _id: room._id }, { $addToSet: { players: user._id } })

                socket.join(roomCode)

                // Kullanıcıyı online işaretle
                if (!user.isOnline) {
                    user.isOnline = true
                    await user.save()
                }

                // Güncel players listesi
                const updatedRoom = await Room.findOne({ code: roomCode }).populate("players")

                io.emit("updatePlayers", updatedRoom)
                io.to(roomCode).emit("systemMessage", `${user.username} joined the room`)
            } catch (error) {
                console.log(error)
            }
        })
        // Odadan ayrıl
        socket.on("leaveRoom", async ({ roomCode }) => {
            try {
                const user = await User.findById(socket.user.userId)
                if (!user) return

                // Kullanıcıyı players listesinden çıkar
                await Room.updateOne({ code: roomCode }, { $pull: { players: user._id } })
                socket.leave(roomCode)

                const updatedRoom = await Room.findOne({ code: roomCode }).populate("players")

                // if (updatedRoom.players.length === 0) {
                //     await Room.deleteOne({ code: roomCode })
                //     io.emit("roomsUpdate", { roomCode })
                // }

                io.emit("updatePlayers", updatedRoom)
                io.to(roomCode).emit("systemMessage", `${user.username} left the room`)
            } catch (error) {
                console.log(error)
            }
        })
        // Odadan yarat
        socket.on("createRoom", async data => {
            const { name, password, user } = data
            const code = Math.random().toString(36).substring(2, 8).toUpperCase()

            let hashedPassword = null
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10)
            }

            const room = await Room.create({
                code,
                name,
                password: hashedPassword,
                createdBy: user.userId,
                players: [user.userId]
            })

            io.emit("roomsUpdate", { room })
            socket.emit("createRoomReturn", { room })
        })
        // Oyunu Başlat
        socket.on("startGame", async ({ roomCode }) => {
            const room = await Room.findOne({ code: roomCode }).populate("players")
            if (!room) return

            activeGames[roomCode] = {
                roomCode,
                players: room.players.map(p => p._id.toString()),
                turnIndex: 0,
                positions: {}, // playerId -> { x, y, targetX, targetY, speed }
                timeout: null,
                loopInterval: null,
                turnActive: false
            }

            const radius = 0.5 // normalize edilmiş yarıçap
            const n = room.players.length

            room.players.forEach((p, i) => {
                const angle = (2 * Math.PI * i) / n
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius

                activeGames[roomCode].positions[p._id.toString()] = {
                    x,
                    y,
                    targetX: x,
                    targetY: y,
                    speed: 0.02 // normalize edilmiş hız
                }
            })

            await Room.updateOne({ code: roomCode }, { $set: { isStarted: true } })
            io.to(roomCode).emit("gameStarted")

            startTurn(io, roomCode)
        })

        socket.on("disconnect", () => {
            console.log("❌ Client disconnected:", socket.user.username)
        })

        socket.on("playerMove", ({ roomCode, x, y }) => {
            const game = activeGames[roomCode]
            if (!game && game.loopInterval != null) return

            var player = activeGames[roomCode].positions[socket.user.id]

            player.targetX = x
            player.targetY = y
        })
    })
}

function startTurn(io, roomCode) {
    const game = activeGames[roomCode]
    if (!game) return

    game.turnActive = true

    io.to(roomCode).emit("turnStarted", {
        positions: game.positions,
        turnTime: TURN_DURATION
    })

    startGameLoop(io, game)
        // .then(game => {
        //     console.log("5 saniyelik oyun döngüsü bitti!")
        //     game.turnActive = false
        //     io.to(roomCode).emit("turnEnded")
        //     setTimeout(() => nextTurn(io, roomCode), TURN_WAIT)
        //     // buraya loop bittikten sonra yapılacak işlemleri yazabilirsin
        // })
        .catch(err => console.error(err))
}

function nextTurn(io, roomCode) {
    const game = activeGames[roomCode]
    if (!game) return

    game.turnIndex = (game.turnIndex + 1) % game.players.length

    startTurn(io, roomCode)
}

function startGameLoop(io, game) {
    return new Promise(resolve => {
        if (game.loopInterval) clearInterval(game.loopInterval)

        const startTime = Date.now()
        const duration = 30_000 // süre 500s (30 saniye örnek)

        game.loopInterval = setInterval(() => {
            const elapsed = Date.now() - startTime
            if (elapsed >= duration) {
                clearInterval(game.loopInterval)
                game.loopInterval = null
                return resolve(game) // loop bitti
            }

            const positions = game.positions

            // Oyuncuları hedef pozisyonlarına doğru hareket ettir
            Object.values(positions).forEach(p => {
                const dx = p.targetX - p.x
                const dy = p.targetY - p.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 0.001) return

                // Normalized speed: p.speed artık normalize edilmiş değerde (-1..1)
                const moveDist = Math.min(p.speed, dist)
                p.x += (dx / dist) * moveDist
                p.y += (dy / dist) * moveDist

                // Opsiyonel: arena sınırı -1..1 aralığında
                p.x = Math.max(-1, Math.min(1, p.x))
                p.y = Math.max(-1, Math.min(1, p.y))
            })

            // Object.values(positions).forEach(p => {
            //     console.log(p.x, p.y)
            // })

            const ids = Object.keys(positions)
            for (let i = 0; i < ids.length; i++) {
                const id1 = ids[i]
                const p1 = positions[id1]

                for (let j = i + 1; j < ids.length; j++) {
                    const id2 = ids[j]
                    const p2 = positions[id2]

                    // distance hesapla (x,y -1..1 aralığında)
                    const dx = p1.x - p2.x
                    const dy = p1.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    const minDist = 0.1
                    if (dist <= minDist) {
                        // normalize etme (iki oyuncunun arasındaki yön)
                        const nx = dx / (dist || 1) // dist 0 olmasın diye ||1
                        const ny = dy / (dist || 1)

                        // iki oyuncuyu birbirinden 0.05 kadar it
                        const push = 0.03

                        p1.x += nx * push
                        p1.y += ny * push
                        p2.x -= nx * push
                        p2.y -= ny * push
                        p1.targetX += nx * push
                        p1.targetY += ny * push
                        p2.targetX -= nx * push
                        p2.targetY -= ny * push

                        // sınır içinde kalmaları için clamp
                        p1.x = Math.max(-1, Math.min(1, p1.x))
                        p1.y = Math.max(-1, Math.min(1, p1.y))
                        p2.x = Math.max(-1, Math.min(1, p2.x))
                        p2.y = Math.max(-1, Math.min(1, p2.y))
                    }
                }
            }

            // Clientlara güncel pozisyonları gönder
            io.to(game.roomCode).emit("stateUpdate", positions)
        }, TICK_RATE)
    })
}

// function startGameLoop(io, game) {
//     return new Promise(resolve => {
//         if (game.loopInterval) clearInterval(game.loopInterval)

//         const startTime = Date.now()
//         const duration = 30_000
//         const minDist = 0.05
//         const pushFactor = 0.02
//         const gridSize = 10

//         game.loopInterval = setInterval(() => {
//             const elapsed = Date.now() - startTime
//             if (elapsed >= duration) {
//                 clearInterval(game.loopInterval)
//                 game.loopInterval = null
//                 return resolve(game)
//             }

//             const positions = game.positions

//             // 1️⃣ Normal hareket
//             Object.values(positions).forEach(p => {
//                 const dx = p.targetX - p.x
//                 const dy = p.targetY - p.y
//                 const dist = Math.sqrt(dx * dx + dy * dy)
//                 if (dist < 0.001) return
//                 const moveDist = Math.min(p.speed, dist)
//                 p.x += (dx / dist) * moveDist
//                 p.y += (dy / dist) * moveDist
//                 p.x = Math.max(-1, Math.min(1, p.x))
//                 p.y = Math.max(-1, Math.min(1, p.y))
//             })

//             // 2️⃣ Bucketlara ayır
//             const buckets = Array.from({ length: gridSize }, () =>
//                 Array.from({ length: gridSize }, () => [])
//             )

//             Object.values(positions).forEach(p => {
//                 const gx = Math.floor(((p.x + 1) / 2) * gridSize)
//                 const gy = Math.floor(((p.y + 1) / 2) * gridSize)
//                 const x = Math.max(0, Math.min(gridSize - 1, gx))
//                 const y = Math.max(0, Math.min(gridSize - 1, gy))
//                 buckets[x][y].push(p)
//             })

//             // 3️⃣ Çarpışma
//             const checkedPairs = new Set() // aynı çifti birden hesaplamamak için
//             for (let i = 0; i < gridSize; i++) {
//                 for (let j = 0; j < gridSize; j++) {
//                     const bucket = buckets[i][j]

//                     // aynı kare ve 8 komşu kare
//                     const neighbors = []
//                     for (let dx = -1; dx <= 1; dx++) {
//                         for (let dy = -1; dy <= 1; dy++) {
//                             const ni = i + dx
//                             const nj = j + dy
//                             if (ni < 0 || nj < 0 || ni >= gridSize || nj >= gridSize) continue
//                             neighbors.push(...buckets[ni][nj])
//                         }
//                     }

//                     // çarpışma kontrolü
//                     bucket.forEach(p1 => {
//                         neighbors.forEach(p2 => {
//                             if (p1 === p2) return
//                             const key = [p1, p2].sort().join(",")
//                             if (checkedPairs.has(key)) return
//                             checkedPairs.add(key)

//                             const dx = p2.x - p1.x
//                             const dy = p2.y - p1.y
//                             const dist = Math.sqrt(dx * dx + dy * dy)
//                             if (dist < minDist && dist > 0) {
//                                 const overlap = ((minDist - dist) / dist) * pushFactor
//                                 const pushX = dx * overlap
//                                 const pushY = dy * overlap
//                                 p1.targetX -= pushX
//                                 p1.targetY -= pushY
//                                 p2.targetX += pushX
//                                 p2.targetY += pushY

//                                 // arena sınırı
//                                 p1.targetX = Math.max(-1, Math.min(1, p1.targetX))
//                                 p1.targetY = Math.max(-1, Math.min(1, p1.targetY))
//                                 p2.targetX = Math.max(-1, Math.min(1, p2.targetX))
//                                 p2.targetY = Math.max(-1, Math.min(1, p2.targetY))
//                             }
//                         })
//                     })
//                 }
//             }

//             io.to(game.roomCode).emit("stateUpdate", positions)
//         }, TICK_RATE)
//     })
// }

module.exports = { gameSockets }
