import { useState } from "react"
import { useAuth } from "../../context/AuthContext"

export default function LoginCard({ onClose, onSwitch, onForgot }) {
    const { login } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async () => {
        if (!username || !password) return setError("Username and password required")
        setLoading(true)
        setError("")
        try {
            await login(username, password)
            onClose()
        } catch (err) {
            setError(err.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = e => {
        if (e.key === "Enter") handleLogin()
    }

    return (
        <div className="flex flex-col space-y-4" onKeyDown={handleKeyDown}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-2 px-4 py-3 bg-yellow-400 text-purple-900 font-bold rounded-lg hover:bg-yellow-300 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex justify-between text-sm text-white/70 mt-2">
                <button onClick={onSwitch} className="hover:underline text-yellow-400 font-bold">
                    Register
                </button>
                <button onClick={onForgot} className="hover:underline text-yellow-400 font-bold">
                    Forgot Password?
                </button>
            </div>
        </div>
    )
}
