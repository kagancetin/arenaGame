import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState, useRef, useEffect } from "react"

export default function Header({ openModal }) {
    const { user, logout } = useAuth()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Sayfaya tıklayınca dropdown kapanması
    useEffect(() => {
        const handleClickOutside = event => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-purple-900 text-white shadow-md">
            <div className="text-2xl font-bold">
                <Link to="/">GameZone</Link>
            </div>
            <nav className="flex items-center space-x-4">
                <Link to="/leaderboard" className="hover:text-yellow-400 transition-colors">
                    Leaderboard
                </Link>

                {!user ? (
                    <>
                        <button
                            onClick={() => openModal("login")}
                            className="px-4 py-1 bg-yellow-500 text-purple-900 font-bold rounded hover:bg-yellow-400 transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => openModal("register")}
                            className="px-4 py-1 bg-yellow-500 text-purple-900 font-bold rounded hover:bg-yellow-400 transition-colors"
                        >
                            Register
                        </button>
                    </>
                ) : (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="px-4 py-1 bg-yellow-500 text-purple-900 font-bold rounded hover:bg-yellow-400 transition-colors"
                        >
                            {user.username} ▼
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-40 bg-white text-purple-900 rounded shadow-lg py-2">
                                <Link
                                    to="/profile"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/settings"
                                    className="block px-4 py-2 hover:bg-gray-100"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    Settings
                                </Link>
                                <button
                                    onClick={() => {
                                        logout()
                                        setDropdownOpen(false)
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    )
}
