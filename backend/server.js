// server.js
require("dotenv").config()
const fastify = require("fastify")({ logger: true })
const fastifyJwt = require("@fastify/jwt")
const fastifyCors = require("@fastify/cors")
const cookie = require("@fastify/cookie")
const mongoose = require("mongoose")
const { Server } = require("socket.io")
const { gameSockets } = require("./sockets/gameSockets")
const port = process.env.PORT || 5001

const authRoutes = require("./routes/authRoutes")
const roomRoutes = require("./routes/roomRoutes")

fastify.register(fastifyCors, {
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true // cookie/jwt gönderiyorsan
})

// JWT plugin
fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
    cookie: {
        cookieName: "refreshToken",
        signed: false
    }
})

fastify.register(cookie, {
    secret: process.env.COOKIE_SECRET || "a very secret key", // cookie imzası için
    parseOptions: {} // opsiyonel
})

fastify.decorate("authenticate", async (req, reply) => {
    try {
        await req.jwtVerify()
    } catch (err) {
        reply.code(401).send({ error: "Unauthorized" })
    }
})

// MongoDB bağlantısı
const startDB = async () => {
    try {
        await mongoose.connect(process.env.MONGOURI)
        console.log("✅ MongoDB connected")
    } catch (err) {
        console.error("❌ MongoDB connection error:", err)
        process.exit(1)
    }
}

// Routes
fastify.register(authRoutes, { prefix: "/auth" })
fastify.register(roomRoutes, { prefix: "/room" })

const io = new Server(fastify.server, {
    cors: { origin: "http://localhost:5173", credentials: true, methods: ["GET", "POST"] }
})

// gameSockets fonksiyonuna fastify’i de geçiriyoruz, JWT doğrulaması için
gameSockets(io, fastify)

// Basit route
fastify.get("/", async (request, reply) => {
    return { message: "Fastify server is running 🚀" }
})

// Sunucuyu başlat
const startServer = async () => {
    try {
        await startDB()
        await fastify.listen({ port, host: "0.0.0.0" })
        console.log(`✅ Server running at http://localhost:${port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

startServer()
