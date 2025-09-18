import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAxios } from "../../context/AxiosContext"

export default function GameLobby({ socket }) {
    const [rooms, setRooms] = useState([])
    const api = useAxios()

    const getRooms = () => {
        api.get("/room/rooms").then(res => {
            setRooms(res.data)
        })
    }

    useEffect(() => {
        getRooms()
        socket.on("roomsUpdate", () => getRooms())
        socket.on("updatePlayers", room => {
            setRooms(rooms => rooms.map(r => (r._id === room._id ? room : r)))
        })

        return () => {
            socket.off("roomsUpdate")
            socket.off("updatePlayers")
        }
    }, [socket])

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6">🎮 Oyun Odaları</h1>
            <p>
                {socket && socket.connected ? "Bağlantınız var: " + socket.id : "Bağlantınız yok"}
            </p>

            <div className="w-full max-w-4xl grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {rooms.length === 0 && (
                    <p className="text-gray-400 text-center col-span-full py-6">Henüz oda yok.</p>
                )}

                {rooms.map(room => (
                    <div
                        key={room._id}
                        className="bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col justify-between hover:bg-gray-700 transition"
                    >
                        <div>
                            <h2 className="text-xl font-semibold mb-2">{room.name}</h2>
                            <p className="text-gray-300">
                                {room.players.length}/{room.maxPlayers} oyuncu
                            </p>
                        </div>

                        <Link
                            to={`/game/${room.code}`}
                            className="mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded font-semibold transition"
                        >
                            Katıl
                        </Link>
                    </div>
                ))}
            </div>

            <Link
                to="/game/create"
                className="mt-6 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition"
            >
                + Yeni Oda Kur
            </Link>
        </div>
    )
}
