import React, { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const savedAccessToken = localStorage.getItem("accessToken")
    const [accessToken, setAccessToken] = useState(savedAccessToken)
    const [user, setUser] = useState(() => {
        if (!savedAccessToken) return null
        try {
            const decoded = jwtDecode(savedAccessToken)
            return { id: decoded.id, username: decoded.username }
        } catch {
            return null
        }
    })

    const isTokenExpired = token => {
        if (!token) return true
        try {
            const { exp } = jwtDecode(token)
            return Date.now() >= exp * 1000
        } catch {
            return true
        }
    }

    const refresh = async () => {
        if (!accessToken) return
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/refresh`,
                {}, // body boş, cookie ile geliyor
                { withCredentials: true }
            )
            const { accessToken: newAccessToken } = res.data
            setAccessToken(newAccessToken)
            localStorage.setItem("accessToken", newAccessToken)
            const decoded = jwtDecode(newAccessToken)
            setUser({ id: decoded.sub, username: decoded.username })
            return newAccessToken
        } catch (err) {
            console.error("Refresh failed", err)
            logout()
        }
    }

    const login = async (username, password) => {
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/login`,
            { username, password },
            { withCredentials: true }
        )
        const { accessToken: newAccessToken } = res.data
        setAccessToken(newAccessToken)
        localStorage.setItem("accessToken", newAccessToken)
        const decoded = jwtDecode(newAccessToken)
        setUser({ id: decoded.sub, username: decoded.username })
    }

    const logout = () => {
        setUser(null)
        setAccessToken(null)
        localStorage.removeItem("accessToken")
        axios
            .post(`${import.meta.env.VITE_API_URL}/auth/logout`, {}, { withCredentials: true })
            .catch(() => {})
    }

    // Sayfa açıldığında token kontrolü
    useEffect(() => {
        const initAuth = async () => {
            if (!accessToken || isTokenExpired(accessToken)) {
                await refresh()
            }
        }
        initAuth()
    }, [])

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, refresh, isTokenExpired }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
