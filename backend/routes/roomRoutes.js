// routes/roomRoutes.js
const { Room } = require("../models/Room")
const bcrypt = require("bcryptjs")

async function roomRoutes(fastify, opts) {
    // Oda listesi
    fastify.get("/rooms", async (req, reply) => {
        const rooms = await Room.find().select("-password").populate("players") // parolayı göndermeyelim
        return rooms
    })

    // Yeni oda oluştur
    fastify.post("/create", { preValidation: [fastify.authenticate] }, async (req, reply) => {
        const { name, password } = req.body
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()

        let hashedPassword = null
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10)
        }

        const room = await Room.create({
            code,
            name,
            password: hashedPassword,
            createdBy: req.user.userId,
            players: [req.user.userId]
        })

        return { code: room.code, name: room.name }
    })
}

module.exports = roomRoutes
