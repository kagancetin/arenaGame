const {
    register,
    login,
    profile,
    users,
    refresh,
    logout
} = require("../controllers/authController")

async function authRoutes(fastify) {
    fastify.post("/register", register)
    fastify.post("/login", login)
    fastify.post("/refresh", refresh)
    fastify.post("/logout", logout)
    fastify.get("/profile", { preHandler: [fastify.authenticate] }, profile)
    fastify.get("/users", users)
}

module.exports = authRoutes
