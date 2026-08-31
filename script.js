// ===== Todo Application =====

// DOM Elements
const todoForm = document.getElementById('addTodoForm');
const todoText = document.getElementById('todoText');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const todoCount = document.getElementById('todoCount');
const completedCount = document.getElementById('completedCount');
const toggleTodosBtn = document.getElementById('toggleTodosBtn');
const toggleText = document.getElementById('toggleText');
const todoListContainer = document.getElementById('todoListContainer');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// State
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let showTodos = true;

// ===== Utility Functions =====

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize input
 */
function sanitizeInput(text) {
    if (!text) return '';
    return text.toString()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Save todos to localStorage
 */
function saveTodos() {
    try {
        localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos:', error);
        alert('Error saving todos. Your browser storage may be full.');
    }
}

// ===== Render Functions =====

/**
 * Render a single todo item
 */
function renderTodo(todo, index) {
    const isCompleted = todo.done || false;
    
    return `
        <div class="todo-item ${isCompleted ? 'todo-completed' : ''}" data-id="${todo.id}">
            <input 
                type="checkbox" 
                class="form-check-input todo-checkbox" 
                ${isCompleted ? 'checked' : ''}
                onchange="toggleDone('${todo.id}')"
            >
            <span class="todo-text" onclick="toggleDone('${todo.id}')">
                ${escapeHtml(todo.text)}
            </span>
            <div class="todo-actions">
                <button class="todo-action-btn edit" onclick="editTodo('${todo.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="todo-action-btn delete" onclick="deleteTodo('${todo.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Render all todos
 */
function renderTodos() {
    if (!showTodos) {
        todoListContainer.style.display = 'none';
        return;
    }
    
    todoListContainer.style.display = 'block';
    
    if (todos.length === 0) {
        todoList.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        todoList.innerHTML = todos.map(todo => renderTodo(todo)).join('');
    }
    
    updateCounters();
}

/**
 * Update counters
 */
function updateCounters() {
    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    
    todoCount.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    completedCount.textContent = completed > 0 ? `(${completed} done)` : '';
}

// ===== Todo Operations =====

/**
 * Add a new todo
 */
function addTodo(text) {
    if (!text || text.trim() === '') return;
    
    const newTodo = {
        id: generateId(),
        text: sanitizeInput(text.trim()),
        done: false,
        createdAt: new Date().toISOString()
    };
    
    todos.push(newTodo);
    saveTodos();
    renderTodos();
    
    // Clear input and focus
    todoText.value = '';
    todoText.focus();
}

/**
 * Toggle done status
 */
function toggleDone(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.done = !todo.done;
        saveTodos();
        renderTodos();
    }
}

/**
 * Edit a todo
 */
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        const newText = prompt('Edit task:', todo.text);
        if (newText !== null && newText.trim() !== '') {
            todo.text = sanitizeInput(newText.trim());
            saveTodos();
            renderTodos();
        }
    }
}

/**
 * Delete a todo
 */
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
    }
}

/**
 * Clear completed todos
 */
function clearCompleted() {
    if (confirm('Are you sure you want to delete all completed tasks?')) {
        todos = todos.filter(t => !t.done);
        saveTodos();
        renderTodos();
    }
}

/**
 * Clear all todos
 */
function clearAll() {
    if (confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) {
        todos = [];
        saveTodos();
        renderTodos();
    }
}

// ===== Toggle Visibility =====

function toggleTodos() {
    showTodos = !showTodos;
    
    if (showTodos) {
        toggleText.textContent = 'Hide Todos';
        toggleTodosBtn.innerHTML = '<i class="bi bi-eye me-1"></i> <span id="toggleText">Hide Todos</span>';
        todoListContainer.style.display = 'block';
    } else {
        toggleText.textContent = 'Show Todos';
        toggleTodosBtn.innerHTML = '<i class="bi bi-eye-slash me-1"></i> <span id="toggleText">Show Todos</span>';
        todoListContainer.style.display = 'none';
    }
}

// ===== Event Listeners =====

// Add todo on form submit
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(todoText.value);
});

// Add todo on Enter key (without Shift)
todoText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addTodo(todoText.value);
    }
});

// Toggle todos visibility
toggleTodosBtn.addEventListener('click', toggleTodos);

// Clear completed
clearCompletedBtn.addEventListener('click', clearCompleted);

// Clear all
clearAllBtn.addEventListener('click', clearAll);

// Auto-focus on page load
window.addEventListener('load', () => {
    todoText.focus();
});

// ===== Initialize =====

function init() {
    // Load todos from localStorage
    try {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
    } catch (error) {
        console.error('Error loading todos:', error);
        todos = [];
    }
    
    // Initial render
    renderTodos();
}

// Start the app
init();

// Make functions globally available
window.toggleDone = toggleDone;
window.editTodo = editTodo;
window.deleteTodo = deleteTodo;
