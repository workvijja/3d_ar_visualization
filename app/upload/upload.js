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

const init_data = () => {
    const d = $.Deferred()

    const payload = new FormData()

    const section = form.children("div")
    section.each(function (i) {
        const item = $(this)
        const item_id = item.attr("id")
        const containers = item.find("div[id|='" + item_id + "']")
        const index = i
        containers.each(function (i) {
            const container = $(this)
            const inputs = container.find("input[id|='" + item_id + "']")
            inputs.each(function (i) {
                const input = $(this)
                const input_name = input.attr("id").split("-").pop()
                let input_value = (input.attr("type") === "file") ? input.prop("files")[0] : input.val();
                if (!input_value) {
                    d.reject(["Please fill", item_id, input_name, "field"].join(" "))
                    return false
                }
                payload.append([index, item_id, input_name].join("_"), input_value)
            })
            if (d.state() === "rejected") return false
        })
        if (d.state() === "rejected") return false
    })
    if (d.state() === "pending") d.resolve(payload)

    return d.promise()
}

const post = (payload) => {
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

    // init_data()
    init_data().then(
        (data) => {
            console.log(...data)
        },
        (err) => {
            show_error(err)
            btn_upload_reset()
        }
    )
}
form.on("submit", upload)