const form = $("form")
console.log(form)
// buat function invalid

const upload = (e) => {
    e.preventDefault()
    
    const obj_container = form.find("#3d-object-container")
    
    const obj_name = obj_container.find("#name")
    const obj_name_val = obj_name.val()
    if (!obj_name_val) return
    
    const obj_thumbnail = obj_container.find("#3d-object-thumbnail")
    const obj_thumbnail_file = obj_thumbnail.prop("files")[0]
    if (!obj_thumbnail_file) return
    
    const obj_file = obj_container.find("#3d-object-file")
    const obj_file_file = obj_file.prop("files")[0]
    if (obj_file_file) return
    
    const obj = {
        name: obj_name_val,
        thumbnail: obj_thumbnail_file,
        file: obj_file_file
    }
    console.log(obj)

    const textures = form.find(".texture-container")
    // console.log(textures)
    const textures_arr = []
    textures.each(function (i) {
        console.log(this)
        const txt_name = $(this).find(".texture-name")
        const txt_name_val = txt_name.val()
        if (!txt_name_val) return

        const txt_thumbnail = $(this).find(".texture-thumbnail")
        const txt_thumbnail_file = txt_thumbnail.prop("files")[0]
        if (!txt_thumbnail_file) return

        const txt_file = $(this).find(".texture-file")
        const txt_file_file = txt_file.prop("files")[0]
        if (!txt_file_file) return

        const texture = {
            name: txt_name_val,
            thumbnail: txt_thumbnail_file,
            file: txt_file_file
        }
        console.log(texture)
        textures_arr.push(texture)
    })
    console.log(textures_arr)
    const payload = {
        obj: obj,
        textures: textures_arr
    }
    console.log(payload)
    // function kirim ke database
}
form.on("submit", upload)