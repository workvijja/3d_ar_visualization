import express from 'express'
import bodyParser from 'body-parser'
import formidable from 'formidable'
import fs from 'fs'
import shortid from 'shortid'
import { join, resolve } from 'path'
import { pool, file_folder, thumbnail_folder, temp_folder } from '../../env.js'
import { format, raw } from 'mysql'

export { router }

const router = express.Router()
const jsonParser = bodyParser.json()

const init_data = (fields) => {
    return new Promise((resolve, reject) => {
        try {
            const data = {}
            Object.entries(fields).sort().forEach(([key, value]) => {
                const [index, item, name] = key.split("_")
                if (!data[item]) data[item] = []
                if (!data[item][index]) data[item][index] = {}
                data[item][index][name] = value
            })
            Object.entries(data).forEach(([key, value]) => {
                data[key] = value.filter((n) => n)
            })
            Object.entries(data).forEach(([key, value]) => {
                data[key].forEach((item, index) => {
                    ["file", "thumbnail"].forEach((name) => {
                        const container = data[key][index]
                        if (container[name]) {
                            container[[name, "original", "path"].join("_")] = container[name].filepath
                            container[[name, "path"].join("_")] = join(eval(name + '_folder'), generate_file_name(container[name].originalFilename))
                            const directories = container[[name, 'path'].join("_")].split("\\")
                            container[[name, 'save', 'path'].join("_")] = directories.slice(directories.indexOf("public")).join("/")
                        }
                    })
                })
            })
            resolve(data)
        } catch (error) {
            reject(error.message || error)
        }
    })
}

const generate_file_name = (original_file_name) => {
    // file.originalFilename
    return [shortid.generate(), original_file_name.split(".").pop()].join(".")
}

const move_file = (old_file_path, new_file_path) => {
    try {
        fs.renameSync(old_file_path, new_file_path)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}

const query_store = (connection, store_name, is_select) => {
    return new Promise((resolve, reject) => {
        const query = (is_select) ? "SELECT s.id FROM store AS s WHERE name = ?" : 'INSERT INTO store (name) VALUES (?)'
        connection.query(
            query,
            [store_name],
            (err, results, fields) => {
                try {
                    const context = { connection: connection }
                    if (err) {
                        context.message = "Failed to " + (is_select) ? "select" : "insert" + " store. " + err.message
                        throw context
                    }
                    if (is_select) {
                        if (results.length > 0) {
                            context.data = results[0].id
                            context.message = "Success to select store"
                            resolve(context)
                        } else {
                            context.message = "Result doesn't exist"
                            // const insert_result = await query_store(connection, store_name, false)
                            resolve(context)
                        }
                    } else {
                        context.data = results.insertId
                        context.message = "Success to insert store"
                        resolve(context)
                    }
                } catch (error) {
                    reject({ connection: error.connection || connection, message: error.message || error })
                }
            }
        )
    })
}

const insert_query = (connection, table, data) => {
    return new Promise((resolve, reject) => {
        const query = format('INSERT INTO ? SET ?', [raw(table), data])
        connection.query(query, (err, results, fields) => {
            try {
                const context = { connection: connection }
                if (err) {
                    context.message = `Failed to insert ${table}. ` + err.message
                    throw context
                }
                context.data = results.insertId
                context.message = `Success to insert ${table}`
                resolve(context)
            } catch (error) {
                reject({ connection: error.connection || connection, message: error.message || error })
            }
        })
    })
}

const insert = (data) => {
    return new Promise((resolve, reject) => {
        pool.getConnection(async (err, connection) => {
            try {
                if (err) throw { message: "Failed to connect to database. " + err.message }

                const transaction = connection.beginTransaction((err) => err)
                if (transaction.message) throw { connection: connection, message: "Failed to create transaction. " + transaction.message }

                let store_id
                const select_store = await query_store(connection, data.store[0].name, true)
                if (!select_store.data) {
                    console.log(select_store.message)
                    const insert_store = await query_store(connection, data.store[0].name, false)
                    if (insert_store.data) {
                        console.log(insert_store.message, insert_store.data)
                        connection = insert_store.connection
                        store_id = insert_store.data
                    } else {
                        insert_store.message = "No insert store data"
                        throw insert_store
                    }
                } else {
                    console.log(select_store.message, select_store.data)
                    connection = select_store.connection
                    store_id = select_store.data
                }
                console.log(store_id)

                let cloth_thumbnail_id
                const insert_cloth_thumbnail = await insert_query(connection, "thumbnail", { url: data.object[0].thumbnail_save_path })
                if (insert_cloth_thumbnail.data) {
                    console.log(insert_cloth_thumbnail.message, insert_cloth_thumbnail.data)
                    connection = insert_cloth_thumbnail.connection
                    cloth_thumbnail_id = insert_cloth_thumbnail.data
                } else {
                    insert_cloth_thumbnail.message = "No insert cloth thumbnail data"
                    throw insert_cloth_thumbnail
                }
                console.log(cloth_thumbnail_id)

                let cloth_id
                const insert_cloth = await insert_query(connection, "cloth", { store_id: store_id, thumbnail_id: cloth_thumbnail_id, name: data.object[0].name, description: data.object[0].description, url: data.object[0].file_save_path })
                if (insert_cloth.data) {
                    console.log(insert_cloth.message, insert_cloth.data)
                    connection = insert_cloth.connection
                    cloth_id = insert_cloth.data
                } else {
                    insert_cloth.message = "No insert cloth data"
                    throw insert_cloth
                }
                console.log(cloth_id)

                await data.textures.forEach(async (t) => {
                    try {
                        let texture_thumbnail_id
                        const insert_texture_thumbnail = await insert_query(connection, "thumbnail", { url: t.thumbnail_save_path })
                        if (insert_texture_thumbnail.data) {
                            console.log(insert_texture_thumbnail.message, insert_texture_thumbnail.data)
                            connection = insert_texture_thumbnail.connection
                            texture_thumbnail_id = insert_texture_thumbnail.data
                        } else {
                            insert_texture_thumbnail.message = "No insert texture thumbnail data"
                            throw insert_texture_thumbnail
                        }
                        console.log(texture_thumbnail_id)

                        let texture_id
                        const insert_texture = await insert_query(connection, "texture", { cloth_id: cloth_id, thumbnail_id: texture_thumbnail_id, name: t.name, url: t.file_save_path })
                        if (insert_texture.data) {
                            console.log(insert_texture.message, insert_texture.data)
                            connection = insert_texture.connection
                            texture_id = insert_texture.data
                        } else {
                            insert_texture.message = "No insert texture data"
                            throw insert_texture
                        }
                        console.log(texture_id)
                    } catch (error) {
                        throw error
                    }
                })

                if (!move_file(data.object[0].file_original_path, data.object[0].file_path)) throw { connection: connection, message: "Failed to move cloth file" }
                if (!move_file(data.object[0].thumbnail_original_path, data.object[0].thumbnail_path)) throw { connection: connection, message: "Failed to move cloth thumbnail file" }

                data.textures.forEach((t) => {
                    try {
                        if (!move_file(t.file_original_path, t.file_path)) throw { connection: connection, message: "Failed to move texture file" }
                        if (!move_file(t.thumbnail_original_path, t.thumbnail_path)) throw { connection: connection, message: "Failed to move texture thumbnail file" }
                    } catch (error) {
                        throw error
                    }
                })

                const commit = connection.commit((err) => err)
                if (commit.message) throw { connection: connection, message: "Failed to commit insert. " + err.message }
                connection.release()
                resolve({message: "Upload Success", store_name: data.store[0].name, cloth_id: cloth_id})
            } catch (error) {
                if (error.connection) {
                    connection.rollback()
                    connection.release()
                }
                reject(error.message || error)
            }
        })
    })
}

const parse_form = (req) => {
    return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm()
        form.uploadDir = temp_folder

        form.parse(req, (err, fields, files) => {
            try {
                if (err) {
                    throw (err)
                }
                resolve(Object.assign(fields, files))
            } catch (error) {
                reject(error)
            }
        })
    })
}

router.route("/")
    .get((req, res, next) => {
        // res.render("upload/index")
        res.context = {
            title: "Upload",
            script_path: "./scripts/upload",
            body_path: "./upload/index"
        }
        next()
    })
    .post(async (req, res) => {
        try {
            const parsed_data = await parse_form(req)
            const data = await init_data(parsed_data)
            // benerin insert texture. cuma ke insert 1
            const insert_message = await insert(data)
            insert_message.link = `${req.protocol}://${req.get('host')}/view/${insert_message.store_name}/${insert_message.cloth_id}`
            console.log(insert_message)

            res.status(200).send(insert_message)
        } catch (error) {
            res.status(500).send(error)
        }
    })

const render = (req, res) => {
    res.render("base", res.context)
}
router.use(render)


