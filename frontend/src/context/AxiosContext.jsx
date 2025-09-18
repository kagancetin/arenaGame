import React, { createContext, useContext, useMemo } from "react"
import axios from "axios"
import { useAuth } from "./AuthContext"

const AxiosContext = createContext(null)

export const AxiosProvider = ({ children }) => {
    const { accessToken, refresh, logout, isTokenExpired } = useAuth()

    const axiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
            timeout: 10000,
            headers: { "Content-Type": "application/json" },
            withCredentials: true // cookie gönderimi için
        })

        // Request interceptor: her istekte token kontrolü ve gerekirse refresh
        instance.interceptors.request.use(
            async config => {
                let token = accessToken
                if (!token || isTokenExpired(token)) {
                    token = await refresh()
                }
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }
                return config
            },
            error => Promise.reject(error)
        )

        // Response interceptor: 401 → refresh + retry
        instance.interceptors.response.use(
            res => res,
            async err => {
                const originalRequest = err.config
                if (err.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true
                    try {
                        const newToken = await refresh()
                        if (newToken) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`
                            return instance(originalRequest)
                        }
                    } catch {
                        logout()
                    }
                }
                return Promise.reject(err)
            }
        )

        return instance
    }, [accessToken, refresh, logout])

    return <AxiosContext.Provider value={axiosInstance}>{children}</AxiosContext.Provider>
}

export const useAxios = () => useContext(AxiosContext)
