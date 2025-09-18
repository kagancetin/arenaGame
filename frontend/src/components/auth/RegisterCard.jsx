import { useState } from "react"
import { useAxios } from "../../context/AxiosContext"

export default function RegisterCard({ onClose, onSwitch }) {
    const axios = useAxios()
    const [username, setUsername] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleRegister = async () => {
        setLoading(true)
        setError("")
        try {
            const res = await axios.post("/auth/register", {
                username,
                email,
                password,
                displayName,
                avatarUrl
            })
            localStorage.setItem("token", res.data.token)
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || "Register failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col space-y-4">
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
            <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
            <input
                type="text"
                placeholder="Avatar URL"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
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
                onClick={handleRegister}
                disabled={loading}
                className="mt-2 px-4 py-3 bg-yellow-400 text-purple-900 font-bold rounded-lg hover:bg-yellow-300 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Registering..." : "Register"}
            </button>

            <div className="mt-2 text-center text-sm text-white/70">
                Already have an account?
                <button onClick={onSwitch} className="hover:underline text-yellow-400 font-bold">
                    Login
                </button>
            </div>
        </div>
    )
}
