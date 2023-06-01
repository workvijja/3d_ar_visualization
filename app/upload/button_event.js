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
        <div id="texture-container-${counter}" class="d-grid gap-3">
            <h6 class="m-0">Texture ${counter}</h6>
            <div>
                <label for="name" class="form-label">Name</label>
                <input type="text" class="form-control" id="name" placeholder="example">
            </div>
            <div class="row row-cols-1 row-cols-sm-2 gy-2">
                <div class="col">
                    <label for="texture-thumbnail-${counter}" class="form-label">Thumbnail</label>
                    <input class="form-control" type="file" id="texture-thumbnail-${counter}">
                </div>
                <div class="col">
                    <label for="texture-file-${counter}" class="form-label">File</label>
                    <input class="form-control" type="file" id="texture-file-${counter}">
                </div>
            </div>
            <div class="d-flex">
                <button type="button" class="btn btn-outline-danger" id="btn-delete-${counter}">Delete Field</button>
            </div>
        </div>
    `)

    textures.append(temp_container)

    const delete_button = $("#btn-delete-" + counter)
    delete_button.on("click", {counter: counter}, delete_row)
}
add_button.on("click", add_row)