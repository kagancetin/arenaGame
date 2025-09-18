import { useState } from "react"
import { useAxios } from "../../context/AxiosContext"

export default function ForgotPasswordCard({ onClose, onSwitch }) {
    const axios = useAxios()
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    const handleForgot = async () => {
        setLoading(true)
        setError("")
        setMessage("")
        try {
            await axios.post("/auth/forgot-password", { email })
            setMessage("If this email exists, a reset link has been sent.")
        } catch (err) {
            setError(err.response?.data?.message || "Request failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col space-y-4">
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg bg-purple-200/20 text-white placeholder-white/70 border border-purple-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {message && <p className="text-green-400 text-sm">{message}</p>}

            <button
                onClick={handleForgot}
                disabled={loading}
                className="mt-2 px-4 py-3 bg-yellow-400 text-purple-900 font-bold rounded-lg hover:bg-yellow-300 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="mt-2 text-center text-sm text-white/70">
                Remembered your password?
                <button onClick={onSwitch} className="hover:underline text-yellow-400 font-bold">
                    Login
                </button>
            </div>
        </div>
    )
}
