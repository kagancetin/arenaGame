import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import LoginCard from "./LoginCard"
import RegisterCard from "./RegisterCard"
import ForgotPasswordCard from "./ForgotPasswordCard"

export default function AuthModal() {
    const location = useLocation()
    const navigate = useNavigate()
    const [mode, setMode] = useState("login") // login | register | forgot
    const [isOpen, setIsOpen] = useState(false)

    // URL query’ye göre modalı aç/kapat ve mode’u ayarla
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const modal = params.get("authmodal")

        if (modal === "login" || modal === "register" || modal === "forgot") {
            setMode(modal)
            setIsOpen(true)
        } else {
            setIsOpen(false)
        }
    }, [location.search])

    const closeModal = () => {
        setIsOpen(false)
        navigate(location.pathname, { replace: true }) // query parametresini temizle
    }

    if (!isOpen) return null

    const renderCard = () => {
        switch (mode) {
            case "login":
                return (
                    <LoginCard
                        onClose={closeModal}
                        onSwitch={() => navigate("?authmodal=register")}
                        onForgot={() => navigate("?authmodal=forgot")}
                    />
                )
            case "register":
                return (
                    <RegisterCard
                        onClose={closeModal}
                        onSwitch={() => navigate("?authmodal=login")}
                    />
                )
            case "forgot":
                return (
                    <ForgotPasswordCard
                        onClose={closeModal}
                        onSwitch={() => navigate("?authmodal=login")}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 text-white rounded-xl shadow-2xl p-8 w-80 sm:w-96 relative fade-in-up">
                <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 text-white/70 hover:text-white text-lg font-bold"
                >
                    ✕
                </button>

                <h2 className="text-3xl font-extrabold mb-6 text-center drop-shadow-lg">
                    {mode === "login" && "Login"}
                    {mode === "register" && "Register"}
                    {mode === "forgot" && "Forgot Password"}
                </h2>

                {renderCard()}

                <p className="mt-4 text-sm text-white/60 text-center">
                    &copy; 2025 Your Game Studio
                </p>
            </div>
        </div>
    )
}
