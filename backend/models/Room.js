const mongoose = require("mongoose")

const roomSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    maxPlayers: { type: Number, default: 8 },
    isPrivate: { type: Boolean, default: false },
    isStarted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const Room = mongoose.model("Room", roomSchema)
module.exports = { Room }
