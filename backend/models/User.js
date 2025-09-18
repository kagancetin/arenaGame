const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: false },
    passwordHash: { type: String, required: true },
    displayName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    elo: { type: Number, default: 1000 },
    isOnline: { type: Boolean, default: false },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
})

userSchema.methods.setPassword = async function (password) {
    this.passwordHash = await bcrypt.hash(password, 10)
}

userSchema.methods.checkPassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash)
}

const User = mongoose.model("User", userSchema)
module.exports = { User }
