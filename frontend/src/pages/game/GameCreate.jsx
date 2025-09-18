import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAxios } from "../../context/AxiosContext"
import { useAuth } from "../../context/AuthContext"

export default function GameCreate({ socket }) {
    const [name, setName] = useState("")
    const [maxPlayers, setMaxPlayers] = useState(4)
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const api = useAxios()
    const { user } = useAuth()

    const handleCreate = async () => {
        if (!name.trim()) return alert("Oda adı girin")

        socket.emit("createRoom", { name, maxPlayers, password, user })
        socket.on("createRoomReturn", async res => {
            navigate(`/game/${res.room.code}`)
        })
    }
    useEffect(() => {}, [socket])

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
            <h1 className="text-3xl font-bold text-white mb-6">🆕 Yeni Oda Kur</h1>

            <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
                <input
                    type="text"
                    placeholder="Oda adı"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="number"
                    placeholder="Maks oyuncu sayısı"
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(e.target.value)}
                    min={2}
                    max={10}
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    placeholder="Parola (opsiyonel)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={handleCreate}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
                >
                    Odayı Kur
                </button>
            </div>
        </div>
    )
}
