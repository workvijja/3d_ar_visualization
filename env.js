import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql'

export { __dirname, pool, thumbnail_folder, file_folder, temp_folder }

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const thumbnail_folder = path.join(__dirname, "public", "thumbnail")
const file_folder = path.join(__dirname, "public", "object")
const temp_folder = path.join(__dirname, "public", "temp")

const pool = mysql.createPool({
    connectionLimit: 10,
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'skripsi'
})