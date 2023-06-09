const add_button = $("#btn-add-row")
const textures = $("#textures")

const delete_row = (e) => {
    const texture_container = $("#texture-container-" + e.data.counter)
    texture_container.remove()
}

let counter = 1
const add_row = () => {
    counter++

    const temp_container = $.parseHTML(`
        <div id="texture-container-${counter}" class="texture-container d-grid gap-3">
            <h6 class="m-0">Texture ${counter}</h6>
            <div>
                <label for="texture-name-${counter}" class="form-label">Name</label>
                <input id="texture-name-${counter}" name="name" type="text" class="form-control" placeholder="Texture ${counter}" required>
            </div>
            <div class="row row-cols-1 row-cols-sm-2 gy-2">
                <div class="col">
                    <label for="texture-thumbnail-${counter}" class="form-label">Thumbnail</label>
                    <input id="texture-thumbnail-${counter}" name="thumbnail" class="form-control" type="file" accept="image/jpg, image/jpeg, image/png" required>
                </div>
                <div class="col">
                    <label for="texture-file-${counter}" class="form-label">File</label>
                    <input id="texture-file-${counter}" name="file" class="form-control" type="file" accept="image/jpg, image/jpeg, image/png" required>
                </div>
            </div>
            <div class="d-flex justify-content-end mt-3">
                <button type="button" class="btn btn-outline-danger" id="btn-delete-${counter}">Delete Field</button>
            </div>
        </div>
    `)

    textures.append(temp_container)

    const delete_button = $("#btn-delete-" + counter)
    delete_button.on("click", {counter: counter}, delete_row)
}
add_button.on("click", add_row)