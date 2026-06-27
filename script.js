const list = document.getElementById('list');
let todos = JSON.parse(window.localStorage.getItem('todos')) || [];
for (const todo of todos) {
    list.innerHTML += add(todo);
}
const addTodoBtn = document.getElementById('addTodoBtn');
const form = document.getElementById('addtodo');
form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const id = formData.get('id');
    const text = formData.get('text').trim();
    const done = Boolean(formData.get('done'));
    if (id) {
        const todo = todos.find(t => t.id === id);
        todo.text = text;
        todo.done = done;
        save();
        document.getElementById(id).outerHTML = add(todo);
    } else {
        if (text) {
            const todo = { id: uuidv4(), text, done };
            todos.push(todo);
            save();
            list.innerHTML += add(todo);
        }
    }
    resetForm();
    hideForm();
});

function add(todo) {
    return `<tr id=${todo.id}>
    <td><input type="checkbox" ${todo.done ? 'checked' : ''} onchange="check(this, '${todo.id}')" /></td>
    <td>${todo.text}</td>
    <td>
        <i class="bi bi-pencil-square text-primary" onclick="edit('${todo.id}')"></i> 
        <i class="bi bi-trash text-danger" onclick="del('${todo.id}')"></i>
    </td> 
    </tr>`;
}

function resetForm() {
    form.reset();
    form.elements.id.value = '';
}

function check(cb, id) {
    const todo = todos.find(t => t.id === id);
    todo.done = cb.checked;
    save();
}

function edit(id) {
    const todo = todos.find(t => t.id === id);

    form.elements.id.value = todo.id;
    form.elements.text.value = todo.text;
    form.elements.done.checked = todo.done;
    showForm();
}

function del(id) {
    if (confirm('Are you sure?')) {
        todos = todos.filter(t => t.id != id);
        save();
        document.getElementById(id).remove();
    }
}

function save() {
    window.localStorage.setItem('todos', JSON.stringify(todos));
}

function showForm() {
    form.classList.remove('d-none');
    addTodoBtn.classList.add('d-none');
}

function hideForm() {
    form.classList.add('d-none');
    addTodoBtn.classList.remove('d-none');
}


function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}