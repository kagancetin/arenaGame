// src/context/SocketContext.js
import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "../context/AuthContext"

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null)
    const auth = useAuth()

    useEffect(() => {
        const s = io("http://localhost:5001", {
            auth: { user: auth.user, token: auth.accessToken },
            transports: ["websocket"] // polling istemiyorsan
        })
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export function useSocket() {
    return useContext(SocketContext)
}
