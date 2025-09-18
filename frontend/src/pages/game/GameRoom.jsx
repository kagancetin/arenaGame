// src/pages/game/GameRoom.jsx
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import GameAction from "./GameAction"

export default function GameRoom({ socket }) {
    const { id: roomCode } = useParams()
    const navigate = useNavigate()
    const [players, setPlayers] = useState([])
    const [roomName, setRoomName] = useState("Oda") // backend'den çekilebilir
    const [isOwner, setIsOwner] = useState(false)
    const [gameStarted, setGameStarted] = useState(false)

    const [currentTurn, setCurrentTurn] = useState(null) // { playerId, turnTime, positions }
    const [isWaiting, setIsWaiting] = useState(false) // tur arası ekranı

    useEffect(() => {
        if (!socket) return

        console.log(socket)

        // Odaya katıl
        socket.emit("joinRoom", { roomCode })

        // Oda oyuncularını güncelle
        socket.on("updatePlayers", room => {
            setPlayers(room.players)
            if (room.players[0]._id === socket.auth.user.id) setIsOwner(true)
        })
        socket.on("gameStarted", () => {
            setGameStarted(true)
        })

        // Tur başladı
        socket.on("turnStarted", ({ playerId, positions, turnTime }) => {
            setIsWaiting(false)
            setCurrentTurn({ playerId, positions, turnTime })
        })

        // Tur bitti (bekleme ekranı)
        socket.on("turnEnded", () => {
            setIsWaiting(true)
            setCurrentTurn(null)
        })

        // cleanup
        return () => {
            socket.emit("leaveRoom", { roomCode })
            socket.off("updatePlayers")
            socket.off("gameStarted")
            socket.off("turnStarted")
            socket.off("turnEnded")
        }
    }, [socket, roomCode])

    const handleStartGame = () => {
        // oyunu başlat
        socket.emit("startGame", { roomCode })
    }

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
                <h1 className="text-3xl font-bold text-white mb-6">
                    🕹️ {roomName} ({roomCode})
                </h1>

                <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-white mb-4">Oyuncular:</h2>
                    <ul className="space-y-2">
                        {players.map(p => (
                            <li
                                key={p._id}
                                className="text-white px-3 py-2 bg-gray-700 rounded flex justify-between items-center"
                            >
                                {p.username}
                                {p.userId === socket.auth.user.id && (
                                    <span className="text-sm text-blue-400">(Sen)</span>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* {isOwner && ( */}
                    <button
                        onClick={handleStartGame}
                        className="mt-6 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition"
                    >
                        Oyunu Başlat
                    </button>
                    {/* )} */}
                </div>
            </div>
        )
    }

    // Oyun başladıysa → tur ekranı / bekleme ekranı
    if (isWaiting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <h1 className="text-2xl font-bold">⏳ Yeni tur birazdan başlayacak...</h1>
            </div>
        )
    }

    // Sıradaki oyuncu oynuyor
    if (currentTurn) {
        return (
            <GameAction
                socket={socket}
                roomCode={roomCode}
                currentTurn={currentTurn}
                players={players}
            />
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <p>🔄 Oyun yükleniyor...</p>
        </div>
    )
}
