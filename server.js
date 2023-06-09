import express from 'express'
import { createServer as createViteServer } from 'vite'
import { router } from './app/upload/route.js'
import { __dirname } from './env.js'

async function createServer() {
    const app = express()

    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom'
    })

    app.use(vite.middlewares)

    app.set("view engine", "ejs")
    app.use(express.static(__dirname + "/public"))
    
    app.get('/', (req, res) => {
        res.send("tes masuk")
    })
    
    app.use("/upload", router)

    app.listen(5173)
}

createServer()