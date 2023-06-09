import express from 'express'
import bodyParser from 'body-parser'
import formidable from 'formidable'
import fs from 'fs'
import shortid from 'shortid'
import { join } from 'path'
import { pool, object_folder, thumbnail_folder, temp_folder } from '../../env.js'

export { router }

const router = express.Router()
const jsonParser = bodyParser.json()

const init_data = (header, fields, files) => {
    const object = {}

    const fields_key = Object.keys(fields).filter((key) => key.includes(header))
    if (fields_key.length < 1) return false
    fields_key.forEach((key) => {
        const object_key = key.split("_").pop()
        object[object_key] = fields[key]
    })

    const files_key = Object.keys(files).filter((key) => key.includes(header))
    if (files_key.length < 1) return false
    files_key.forEach((key) => {
        const object_key = key.split("_").pop()
        object[object_key] = files[key]
    })

    object["thumbnail_path"] = join(thumbnail_folder, generate_file_name(object["thumbnail"]))
    const thumbnail_directories = object["thumbnail_path"].split("\\")
    object["thumbnail_save_path"] = thumbnail_directories.slice(thumbnail_directories.indexOf("public")).join("/")

    object["file_path"] = join(object_folder, generate_file_name(object["file"]))
    const object_directories = object["file_path"].split("\\")
    object["file_save_path"] = object_directories.slice(object_directories.indexOf("public")).join("/")

    return object
}

const generate_file_name = (file) => {
    return [shortid.generate(), file.originalFilename.split(".").pop()].join(".")
}

const move_file = (file, new_file_path) => {
    try {
        fs.renameSync(file.filepath, new_file_path)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

const insert = (object, textures) => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                console.log(err)
                return reject("Failed to connect to database")
            }

            return connection.beginTransaction((err) => {
                if (err) {
                    connection.release()
                    console.log(err)
                    return reject("Failed to create transaction")
                }
                // insert store
                const temp_store_id = 1
                // insert thumbnail cloth
                return connection.query('INSERT INTO thumbnail (url) VALUES (?)', [object.thumbnail_save_path], (err, results, fields) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release()
                            console.log(err)
                            return reject("Failed to insert cloth thumbnail")
                        })
                    }
                    const cloth_thumbnail_id = results.insertId
                    console.log('cloth thumbnail', cloth_thumbnail_id)
                    // insert cloth
                    return connection.query('INSERT INTO cloth (store_id, thumbnail_id, name, url) VALUES (?, ?, ?, ?)', [temp_store_id, cloth_thumbnail_id, object.name, object.file_save_path], (err, results, fields) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release()
                                console.log(err)
                                return reject("Failed to insert cloth")
                            })
                        }
                        const cloth_id = results.insertId
                        console.log('cloth id', cloth_id)
                        textures.forEach(texture => {
                            // insert thumbnail texture
                            connection.query('INSERT INTO thumbnail (url) VALUES (?)', [texture.thumbnail_save_path], (err, results, fields) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release()
                                        console.log(err)
                                        return reject("Failed to insert texture thumbnail")
                                    })
                                }
                                const texture_thumbnail_id = results.insertId
                                console.log('texture thumbnail id', texture_thumbnail_id)
                                // insert texture
                                return connection.query('INSERT INTO texture (cloth_id, thumbnail_id, name, url) VALUES (?, ?, ?, ?)', [cloth_id, texture_thumbnail_id, texture.name, texture.file_save_path], (err, results, fields) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.log(err)
                                            return reject("Failed to insert texture")
                                        })
                                    }
                                    const texture_id = results.insertId
                                    console.log('texture id', texture_id)
                                })
                            })
                        })
                        // move object
                        if (!move_file(object.file, object.file_path)) {
                            return connection.rollback(() => {
                                connection.release()
                                console.log("Failed to move file to object")
                                return reject("Failed to move file to object")
                            })
                        }
                        if (!move_file(object.thumbnail, object.thumbnail_path)) {
                            return connection.rollback(() => {
                                connection.release()
                                console.log("Failed to move file to thumbnail")
                                return reject("Failed to move file to thumbnail")
                            })
                        }

                        // move texture
                        textures.forEach(texture => {
                            if (!move_file(texture.file, texture.file_path)) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.log("Failed to move file to texture")
                                    return reject("Failed to move file to texture")
                                })
                            }
                            if (!move_file(texture.thumbnail, texture.thumbnail_path)) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.log("Failed to move file to thumbnail")
                                    return reject("Failed to move file to thumbnail")
                                })
                            }
                        })

                        return connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.log(err)
                                    return reject("Failed to commit insert")
                                })
                            }
                            connection.release()
                        })
                    })
                })

            })
        })

    })
}

router.route("/")
    .get((req, res, next) => {
        // res.render("upload/index")
        res.context = {
            title: "Upload",
            body_path: "./upload/index"
        }
        next()
    })
    .post((req, res) => {
        let success = true
        let message = "Insert Success"

        // buat giant try catch
        // semua error pke throw
        // di catch kirim status 400
        // nnti ditampilin di front end
        try {
            const form = new formidable.IncomingForm()
            form.uploadDir = temp_folder

            form.parse(req, (err, fields, files) => {
                if (err) {
                    throw err
                }

                const object = init_data("object", fields, files)

                const textures = []
                let counter = 0
                while (true) {
                    const texture = init_data("textures_" + counter, fields, files)
                    if (!texture) break
                    textures.push(texture)
                    counter++
                }
                console.log(object)
                console.log(textures)

                insert(object, textures).then(
                    null,
                    (error) => {
                        throw error
                    }
                )
                res.status(200).send({ success: success, message: message })
            })
        } catch (error) {
            res.status(500).send({ success: false, message: error.message })
        }
    })

const render = (req, res) => {
    res.render("base", res.context)
}
router.use(render)


