const baseUrl = "http://localhost:3000";
let todos;
const list = document.getElementById('list');
getData();
const addTodoBtn = document.getElementById('addTodoBtn');
const form = document.getElementById('addtodo');

form.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const text = formData.get('text').trim();
        const done = Boolean(formData.get('done'));
        let todo = { text, done }
        if (id) {
            await connect(`${baseUrl}/${id}`, 'PUT', JSON.stringify(todo))
            document.getElementById(id).outerHTML = add(todo);
        } else {
            if (text) {
                todo = await connect(baseUrl, 'POST', JSON.stringify(todo))
                list.innerHTML += add(todo);
            }
        }
        resetForm();
        hideForm();

    } catch (error) {
        console.error('Submit error:', error)
    }
});

async function connect(url, method, body) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-type': 'application/json'
            },
            body
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            return response.text();
        }
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

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

async function check(cb, id) {
    const todo = { done: cb.checked }
    const url = `${baseUrl}/${id}`;
    await connect(url, 'PATCH', JSON.stringify(todo))
}

function edit(id) {
    const todo = todos.find(t => t.id === id);

    form.elements.id.value = todo.id;
    form.elements.text.value = todo.text;
    form.elements.done.checked = todo.done;
    showForm();
}

async function del(id) {
    if (confirm('Are you sure?')) {
        const url = `${baseUrl}/${id}`;
        await connect(url, 'DELETE');
        document.getElementById(id).remove();
    }
}


function showForm() {
    form.classList.remove('d-none');
    addTodoBtn.classList.add('d-none');
}

function hideForm() {
    form.classList.add('d-none');
    addTodoBtn.classList.remove('d-none');
}

async function getData() {
    todos = await connect(baseUrl, 'GET') || []
    for (const todo of todos) {
        list.innerHTML += add(todo);
    }
}