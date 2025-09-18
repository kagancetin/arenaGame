const { User } = require("../models/User")

const generateAccessToken = async (reply, user) => {
    return await reply.jwtSign(
        { userId: user._id, username: user.username, id: user._id },
        { expiresIn: "15m" }
    )
}

const register = async (req, reply) => {
    const { username, password, email } = req.body
    if (!username || !password)
        return reply.code(400).send({ error: "Username and password required" })

    const existing = await User.findOne({ username })
    if (existing) return reply.code(400).send({ error: "Username already exists" })

    const user = new User({ username, email })
    await user.setPassword(password)
    await user.save()

    return { message: "User created successfully" }
}

const login = async (req, reply) => {
    const { username, password } = req.body
    if (!username || !password)
        return reply.code(400).send({ error: "Username and password required" })

    const user = await User.findOne({ username })
    if (!user) return reply.code(401).send({ error: "Invalid credentials" })

    const valid = await user.checkPassword(password)
    if (!valid) return reply.code(401).send({ error: "Invalid credentials" })

    // Access Token
    const accessToken = await generateAccessToken(reply, user)

    // Refresh Token (cookie)
    const refreshToken = await reply.jwtSign({ userId: user._id }, { expiresIn: "7d" })

    reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    })

    return { accessToken }
}

const refresh = async (req, reply) => {
    try {
        const { refreshToken } = req.cookies
        if (!refreshToken) return reply.code(401).send({ error: "No refresh token" })

        const payload = await req.jwtVerify({ token: refreshToken })
        const user = await User.findById(payload.userId)
        if (!user) return reply.code(404).send({ error: "User not found" })

        // Yeni access token üret
        const newAccessToken = await generateAccessToken(reply, user)

        // Refresh token süresini kontrol et
        const decodedRefresh = await req.jwtVerify({ token: refreshToken, decode: true })
        const remainingTime = decodedRefresh.exp * 1000 - Date.now() // ms cinsinden
        const oneHour = 60 * 60 * 1000

        let newRefreshToken = refreshToken

        if (remainingTime < oneHour) {
            // Refresh token süresi 1 saatten az, yenile
            newRefreshToken = await reply.jwtSign(
                { userId: user._id },
                { expiresIn: "7d" } // veya istediğin süre
            )

            reply.setCookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/"
            })
        }

        return { accessToken: newAccessToken, refreshToken: newRefreshToken }
    } catch (err) {
        return reply.code(401).send({ error: "Invalid refresh token" })
    }
}

const logout = async (req, reply) => {
    // refresh token cookie’sini temizle
    reply.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    })

    return { message: "Logged out successfully" }
}

const profile = async (req, reply) => {
    const user = await User.findById(req.user.userId)
    if (!user) return reply.code(404).send({ error: "User not found" })
    return { username: user.username, email: user.email, elo: user.elo }
}

const users = async (req, reply) => {
    const users = await User.find()
    return users
}

module.exports = { register, login, profile, users, refresh, logout }
