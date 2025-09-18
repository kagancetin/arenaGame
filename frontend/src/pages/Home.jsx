// src/pages/Home.jsx
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useLocation, useNavigate } from "react-router-dom"

function Home() {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-purple-900 via-purple-700 to-purple-500 flex flex-col items-center justify-center text-white">
            <h1 className="text-6xl font-extrabold mb-12 drop-shadow-lg">GameZone</h1>

            <div className="flex flex-col space-y-6">
                {user ? (
                    <Link
                        to="/game"
                        className="px-10 py-4 bg-yellow-500 text-purple-900 font-bold text-2xl rounded-lg shadow-lg hover:bg-yellow-400 transform hover:scale-105 transition-all"
                    >
                        Start Game
                    </Link>
                ) : (
                    <button
                        onClick={() => navigate("?authmodal=login")}
                        className="px-10 py-4 bg-yellow-500 text-purple-900 font-bold text-2xl rounded-lg shadow-lg hover:bg-yellow-400 transform hover:scale-105 transition-all"
                    >
                        Login
                    </button>
                )}

                <Link
                    to="/leaderboard"
                    className="px-10 py-4 bg-white text-purple-900 font-bold text-2xl rounded-lg shadow-lg hover:bg-gray-200 transform hover:scale-105 transition-all"
                >
                    Leaderboard
                </Link>
            </div>
        </div>
    )
}

export default Home
