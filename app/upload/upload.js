import { Modal } from "bootstrap"

const modal = new Modal($('#modal'))
const modal_title = $('.modal-title')
const modal_body = $('.modal-body')
// modal.show()

const form = $("form")

const submit_button = $("#btn-submit")
const submit_button_text = $("#btn-submit-text")
const submit_button_spinner = $("#btn-submit .spinner-border")

const btn_upload_reset = () => {
    submit_button.prop("disabled", false)
    submit_button_text.html("Upload")
    submit_button_spinner.css({ "display": "none" })
}

const btn_upload_process = () => {
    submit_button.prop("disabled", true)
    submit_button_text.html("Uploading")
    submit_button_spinner.css({ "display": "" })
}

const show_modal = (content) => {
    modal_title.html(content.title || "")
    modal_body.html(content.body || "")
    modal.show()
}

const show_error = (message) => {
    show_modal({ title: "Error", body: message })
}

const generate_link = () => {
    const content = `
        <div class="d-flex flex-column px-4 py-3">
            <h2 class="text-center fw-bold mb-4">Copy link or download QR</h2>
            <div class="input-group mb-4">
                <input type="text" readonly class="form-control" id="link-input"
                    value="${view_link}">
                <div class="input-group-append">
                    <!-- <i class="bi bi-clipboard-check"></i> -->
                    <button id="btn-copy-link" class="btn btn-outline-secondary" type="button"><i class="bi bi-clipboard"></i></button>
                </div>
            </div>
            <div class="p-4 border rounded-2 mb-4">
                <img class="w-100" src="${image_link}">
            </div>
            <button id="btn-download-img" type="button" class="btn btn-primary">Download QR</button>
        </div>
    `
}

const get_data = (container) => {
    const obj = {}

    const name = container.find("input[name='name']")
    const name_val = name.val()
    if (!name_val) return false
    else obj.name = name_val

    const thumbnail = container.find("input[name='thumbnail']")
    const thumbnail_val = thumbnail.prop("files")[0]
    if (!thumbnail_val) return false
    else obj.thumbnail = thumbnail_val

    const file = container.find("input[name='file']")
    const file_val = file.prop("files")[0]
    if (!file_val) return false
    else obj.file = file_val

    return obj
}

const post = (payload) => {
    console.log(payload)
    $.ajax({
        url: "/upload",
        type: "POST",
        enctype: 'multipart/form-data',
        data: payload,
        processData: false,
        contentType: false,
        success: function (res) {
            if (res.success) {
                show_modal({ title: "Success", body: res.message })
            } else {
                show_error(res.message)
            }
            btn_upload_reset()
        },
        error: function (res) {
            show_error(res.message)
            btn_upload_reset()
        }
    })
}

const upload = (e) => {
    e.preventDefault()
    btn_upload_process()

    const payload = new FormData()
    // tambahin store

    const obj_container = form.find("#3d-object-container")
    const obj = get_data(obj_container)
    // TODO ambil description
    if (!obj) {
        show_error("Please input all field in 3D Object")
        btn_upload_reset()
        return false
    }
    $.each(obj, function (key, value) {
        payload.append("object_" + key, value)
    })

    const textures = form.find(".texture-container")
    let txt_valid = true
    textures.each(function (i) {
        const txt_container = $(this)
        const txt = get_data(txt_container)
        if (!txt) {
            txt_valid = false
            return false
        }
        $.each(txt, function (key, value) {
            payload.append(["textures", i, key].join("_"), value)
        })
    })
    if (!txt_valid) {
        show_error("Please input all field in Textures")
        btn_upload_reset()
        return false
    }

    post(payload)
}
form.on("submit", upload)