import { useEffect, useRef } from "react"
import { Application, Graphics } from "pixi.js"
import { useParams } from "react-router-dom"

export default function GameAction({ socket }) {
    const pixiRef = useRef(null)
    const otherPlayersRef = useRef({}) // id → Graphics
    const players = useRef({}) // id → Graphics
    const { id: roomCode } = useParams()

    const circleSize =
        window.innerWidth > window.innerHeight ? window.innerHeight / 2 : window.innerWidth / 2
    const playerSize =
        window.innerWidth > window.innerHeight
            ? window.innerHeight * 0.028
            : window.innerWidth * 0.028

    useEffect(() => {
        let app

        const setup = async () => {
            app = new Application()
            await app.init({
                resizeTo: window,
                background: 0x000000,
                antialias: true,
                backgroundAlpha: 0.2
            })
            pixiRef.current.appendChild(app.canvas)

            // arena
            const arena = new Graphics()
            arena.circle(window.innerWidth / 2, window.innerHeight / 2, circleSize)
            arena.fill(0x4444aa, 0.5)
            app.stage.addChild(arena)

            const handleContextMenu = e => {
                e.preventDefault()

                const cx = window.innerWidth / 2
                const cy = window.innerHeight / 2
                const r = circleSize

                // Fare koordinatını -1 .. 1 aralığına çevir
                const px = (e.clientX - cx) / r
                const py = (e.clientY - cy) / r

                // Arena sınırları içinde tut
                const clampedX = Math.max(-1, Math.min(1, px))
                const clampedY = Math.max(-1, Math.min(1, py))

                socket.emit("playerMove", {
                    roomCode,
                    x: clampedX,
                    y: clampedY
                })
            }
            app.canvas.addEventListener("contextmenu", handleContextMenu)

            socket.on("stateUpdate", positions => {
                const cx = window.innerWidth / 2
                const cy = window.innerHeight / 2
                const r = circleSize
                const t = 0.2 // 0.0-1.0 arası, yumuşatma faktörü (0.2 iyi başlangıç)

                Object.entries(positions).forEach(([id, p]) => {
                    const player = players.current[id] || new Graphics()
                    if (!players.current[id]) {
                        players.current[id] = player
                    }

                    player.clear()

                    // -1..1 aralığı → piksel koordinat
                    const x = cx + p.x * r
                    const y = cy + p.y * r

                    player.x = x
                    player.y = y
                    player.circle(0, 0, playerSize)

                    if (id === socket.auth.user.id) {
                        player.fill(0xff0000)
                    } else {
                        player.fill(0x00ff00)
                    }
                    app.stage.addChild(player)
                })
            })

            socket.on("playerLeft", id => {
                if (otherPlayersRef.current[id]) {
                    app.stage.removeChild(otherPlayersRef.current[id])
                    delete otherPlayersRef.current[id]
                }
            })
        }

        setup()

        return () => {
            if (app) app.destroy(true, { children: true })
            socket.off("stateUpdate")
            socket.off("playerLeft")
        }
    }, [])

    return (
        <div
            ref={pixiRef}
            className="fixed top-0 left-0 w-full h-full"
            style={{ overflow: "hidden" }}
        ></div>
    )
}
