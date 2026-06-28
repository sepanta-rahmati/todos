const list = document.getElementById('list');
getData();
let todos;
const addTodoBtn = document.getElementById('addTodoBtn');
const form = document.getElementById('addtodo');
form.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();
        const formData = new FormData(form);
        const id = formData.get('id');
        const text = formData.get('text').trim();
        const done = Boolean(formData.get('done'));
        if (id) {
            const todo = todos.find(t => t.id === id);
            todo.text = text;
            todo.done = done;
            await save();
            document.getElementById(id).outerHTML = add(todo);
        } else {
            if (text) {
                const todo = { id: uuidv4(), text, done };
                todos.push(todo);
                await save();
                list.innerHTML += add(todo);
            }
        }
        resetForm();
        hideForm();

    } catch (error) {
        console.error('Submit error:', error)
    }
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

async function check(cb, id) {
    const todo = todos.find(t => t.id === id);
    todo.done = cb.checked;
    await save();
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
        todos = todos.filter(t => t.id != id);
        await save();
        document.getElementById(id).remove();
    }
}

async function save() {
    const url = "http://localhost:3000";
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify(todos)
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
    } catch (error) {
        console.error(error.message);
        throw error;
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


function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

async function getData() {
    const url = "http://localhost:3000";
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        todos = await response.json() || [];
        for (const todo of todos) {
            list.innerHTML += add(todo);
        }
    } catch (error) {
        console.error(error.message);
    }
}