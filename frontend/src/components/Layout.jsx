import { useLocation, useNavigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import Header from "./Header"
import Footer from "./Footer"
import AuthModal from "./auth/AuthModal"

function Layout() {
    const location = useLocation()
    const navigate = useNavigate()
    const [modalMode, setModalMode] = useState(null) // 'login' | 'register' | null
    const isOpen = modalMode !== null

    const closeModal = () => {
        setModalMode(null)
        navigate(location.pathname, { replace: true })
    }

    const openModal = mode => {
        navigate(`?authmodal=${mode}`)
    }

    // Query parametresine göre modal aç/kapa
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const authmodal = params.get("authmodal")
        if (authmodal === "login" || authmodal === "register" || authmodal === "forgot") {
            setModalMode(authmodal)
        } else {
            setModalMode(null)
        }
    }, [location.search])

    return (
        <div className="flex flex-col min-h-screen">
            <Header openModal={openModal} />
            <main className="flex-grow pt-16">
                <Outlet />
            </main>
            <Footer />
            <AuthModal isOpen={isOpen} mode={modalMode} onClose={closeModal} />
        </div>
    )
}

export default Layout
