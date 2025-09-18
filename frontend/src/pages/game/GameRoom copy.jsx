import { useEffect, useRef, useState } from "react"
import { Application, Graphics, Point } from "pixi.js"

export default function GameRoom() {
    const pixiRef = useRef(null)
    //const circleSizeRef = useRef(1)
    const circleSizeRef = useRef(window.innerHeight / 2)
    const playerRef = useRef(null)
    const targetPosRef = useRef({ x: 200, y: 200 })
    let playerSize = 0

    if (window.innerWidth > window.innerHeight) {
        playerSize = window.innerHeight * 0.025
    } else {
        playerSize = window.innerWidth * 0.025
        circleSizeRef.current = window.innerWidth / 2
    }

    useEffect(() => {
        let app

        const setup = async () => {
            // 1️⃣ Application başlat
            app = new Application()
            await app.init({
                resizeTo: window,
                background: 0x000000, // siyah arka plan
                antialias: true,
                backgroundAlpha: 0.2
            })
            pixiRef.current.appendChild(app.canvas)

            // app.stage.interactive = true

            const arena = new Graphics()
            // arena.fill = { color: 0x4444aa, alpha: 1 }

            arena.circle(window.innerWidth / 2, window.innerHeight / 2, circleSizeRef.current)
            arena.fill(0x4444aa, 0.5)
            app.stage.addChild(arena)

            const player = new Graphics()
            player.x = 200
            player.y = 200
            player.circle(0, 0, playerSize)
            player.fill(0xff0000)
            playerRef.current = player
            app.stage.addChild(player)

            // app.stage.on("rightdown", e => {
            //     console.log("Right click:", e.global.x, e.global.y)
            //     targetPosRef.current = { x: e.global.x, y: e.global.y }
            // })
            const handleContextMenu = e => {
                e.preventDefault()
                targetPosRef.current = { x: e.clientX, y: e.clientY }
            }
            app.canvas.addEventListener("contextmenu", handleContextMenu)

            // const shrinkAmount = 0.05 // 10 saniyede küçülmesini istediğin miktar
            // const duration = 10 // saniye
            // const shrinkPerSecond = shrinkAmount / duration // saniye başına küçülme
            // 2️⃣ Daire küçültme
            // app.ticker.add(payload => {
            //     const delta = payload.deltaTime
            //     circleSizeRef.current -= shrinkPerSecond * (delta / 60)
            //     if (circleSizeRef.current < 0) circleSizeRef.current = 0

            //     arena.clear()
            //     arena.fill(0x4444aa)
            //     arena.circle(
            //         window.innerWidth / 2,
            //         window.innerHeight / 2,
            //         window.innerHeight * circleSizeRef.current
            //     )
            //     arena.fill()
            // })

            app.ticker.add(() => {
                if (!playerRef.current) return
                const dx = targetPosRef.current.x - playerRef.current.x
                const dy = targetPosRef.current.y - playerRef.current.y
                console.log(
                    targetPosRef.current.x,
                    targetPosRef.current.y,
                    playerRef.current.x,
                    playerRef.current.y,
                    dx,
                    dy
                )
                if ((dx >= -1 && dx <= 1) || (dy >= -1 && dy <= 1)) return
                const dist = Math.sqrt(dx * dx + dy * dy)
                const speed = 10

                // console.log(
                //     "targetPos",
                //     targetPosRef.current,
                //     playerRef.current.x,
                //     playerRef.current.y
                // )

                playerRef.current.clear()
                playerRef.current.x += Math.round((dx / dist) * speed)
                playerRef.current.y += Math.round((dy / dist) * speed)
                playerRef.current.circle(0, 0, playerSize)
                playerRef.current.fill(0xff0000)
            })
        }

        setup()

        return () => {
            if (app) {
                app.destroy(true, { children: true })
            }
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
