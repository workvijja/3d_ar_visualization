const add_button = $("#btn-add-row")
const texture = $("#texture")

const delete_row = (e) => {
    const texture_container = $("#texture-container-" + e.data.counter)
    texture_container.remove()
}

let counter = 1
const add_row = () => {
    counter++

    const temp_container = $.parseHTML(`
        <div id="texture-container-${counter}" class="d-grid gap-3">
            <h6 class="m-0">Texture ${counter}</h6>
            <div>
                <label for="texture-${counter}-name" class="form-label">Name</label>
                <input id="texture-${counter}-name" name="name" type="text" class="form-control" placeholder="Texture ${counter}" >
            </div>
            <div class="row row-cols-1 row-cols-sm-2 gy-2">
                <div class="col">
                    <label for="texture-${counter}-thumbnail" class="form-label">Thumbnail</label>
                    <input id="texture-${counter}-thumbnail" name="thumbnail" class="form-control" type="file" accept="image/jpg, image/jpeg, image/png" >
                </div>
                <div class="col">
                    <label for="texture-${counter}-file" class="form-label">File</label>
                    <input id="texture-${counter}-file" name="file" class="form-control" type="file" accept="image/jpg, image/jpeg, image/png" >
                </div>
            </div>
            <div class="d-flex justify-content-end mt-3">
                <button type="button" class="btn btn-outline-danger" id="btn-delete-${counter}">Delete Field</button>
            </div>
        </div>
    `)

    texture.append(temp_container)

    const delete_button = $("#btn-delete-" + counter)
    delete_button.on("click", {counter: counter}, delete_row)
}
add_button.on("click", add_row)