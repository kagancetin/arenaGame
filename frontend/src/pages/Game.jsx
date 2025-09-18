// src/pages/Game.jsx
import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import { Routes, Route } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// örnek alt sayfalar
import GameLobby from "./game/GameLobby"
import GameRoom from "./game/GameRoom"
import GameCreate from "./game/GameCreate"
import GameAction from "./game/GameAction"

let socket

function Game() {
    const [isConnected, setIsConnected] = useState(false)
    const auth = useAuth()

    useEffect(() => {
        // ✅ sadece bu component mount olunca bağlan
        socket = io("http://localhost:5001", {
            auth: { user: auth.user, token: auth.accessToken },

            transports: ["websocket"] // polling istemiyorsan
        })
        socket.on("connect", () => {
            setIsConnected(true)
            console.log("✅ Bağlandı:", socket.id)
        })

        socket.on("disconnect", () => {
            setIsConnected(false)
            console.log("❌ Bağlantı koptu")
        })

        // ✅ cleanup → bu component unmount olunca socket kapat
        return () => {
            if (socket) socket.disconnect()
        }
    }, [])

    return (
        isConnected && (
            <Routes>
                <Route path="/" element={<GameLobby socket={socket} />} />
                <Route path="/create" element={<GameCreate socket={socket} />} />
                <Route path="/:id" element={<GameRoom socket={socket} />} />
                <Route path="/game/:id" element={<GameAction socket={socket} />} />
            </Routes>
        )
    )
}

export default Game
