// ===== Todo Application with Backend =====

// ===== Configuration =====
const CONFIG = {
    DEFAULT_SERVER_URL: 'http://localhost:3000',
    TOKEN_KEY: 'todo_app_token',
    USER_KEY: 'todo_app_user',
    SERVER_URL_KEY: 'todo_app_server_url',
    DEMO_MODE_KEY: 'todo_app_demo_mode',
    REQUEST_TIMEOUT: 10000
};

// ===== State =====
let state = {
    todos: [],
    user: null,
    token: null,
    serverUrl: CONFIG.DEFAULT_SERVER_URL,
    isDemoMode: false,
    showTodos: true
};

// ===== DOM Elements =====
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const userBar = document.getElementById('userBar');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const tryDemoBtn = document.getElementById('tryDemoBtn');
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
const syncBtn = document.getElementById('syncBtn');
const serverStatus = document.getElementById('serverStatus');
const serverUrlDisplay = document.getElementById('serverUrl');
const changeServerBtn = document.getElementById('changeServerBtn');
const serverModal = new bootstrap.Modal(document.getElementById('serverModal'));
const serverUrlInput = document.getElementById('serverUrlInput');
const saveServerBtn = document.getElementById('saveServerBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const alertContainer = document.getElementById('alertContainer');

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
 * Show loading overlay
 */
function showLoading(text = 'Loading...') {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('d-none');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    loadingOverlay.classList.add('d-none');
}

/**
 * Show alert notification
 */
function showAlert(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : 
                              type === 'danger' ? 'exclamation-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
        ${escapeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss
    setTimeout(() => {
        const bootstrapAlert = bootstrap.Alert.getOrCreateInstance(alert);
        bootstrapAlert.close();
    }, duration);
}

/**
 * Save state to localStorage
 */
function saveState() {
    try {
        localStorage.setItem(CONFIG.TOKEN_KEY, state.token || '');
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(state.user) || '');
        localStorage.setItem(CONFIG.SERVER_URL_KEY, state.serverUrl || CONFIG.DEFAULT_SERVER_URL);
        localStorage.setItem(CONFIG.DEMO_MODE_KEY, JSON.stringify(state.isDemoMode));
    } catch (error) {
        console.error('Error saving state:', error);
    }
}

/**
 * Load state from localStorage
 */
function loadState() {
    try {
        state.token = localStorage.getItem(CONFIG.TOKEN_KEY) || null;
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        state.user = userData ? JSON.parse(userData) : null;
        state.serverUrl = localStorage.getItem(CONFIG.SERVER_URL_KEY) || CONFIG.DEFAULT_SERVER_URL;
        const demoMode = localStorage.getItem(CONFIG.DEMO_MODE_KEY);
        state.isDemoMode = demoMode ? JSON.parse(demoMode) : false;
    } catch (error) {
        console.error('Error loading state:', error);
    }
}

// ===== API Client =====

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${state.serverUrl}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
        ...options.headers
    };
    
    const config = {
        method: options.method || 'GET',
        headers,
        ...options
    };
    
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
        
        const response = await fetch(url, {
            ...config,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Check server connection
 */
async function checkServerConnection() {
    try {
        await apiRequest('/health', { method: 'GET' });
        return true;
    } catch (error) {
        return false;
    }
}

// ===== Auth Functions =====

/**
 * Login user
 */
async function login(email, password) {
    showLoading('Logging in...');
    
    try {
        const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: { email, password }
        });
        
        state.token = response.token;
        state.user = response.user;
        state.isDemoMode = false;
        saveState();
        
        showAlert('Login successful!', 'success');
        updateUI();
        fetchTodos();
        
        return true;
    } catch (error) {
        showAlert(error.message || 'Login failed', 'danger');
        return false;
    } finally {
        hideLoading();
    }
}

/**
 * Signup user
 */
async function signup(name, email, password) {
    showLoading('Creating account...');
    
    try {
        const response = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: { name, email, password }
        });
        
        state.token = response.token;
        state.user = response.user;
        state.isDemoMode = false;
        saveState();
        
        showAlert('Account created! Welcome!', 'success');
        updateUI();
        fetchTodos();
        
        return true;
    } catch (error) {
        showAlert(error.message || 'Signup failed', 'danger');
        return false;
    } finally {
        hideLoading();
    }
}

/**
 * Logout user
 */
function logout() {
    state.token = null;
    state.user = null;
    state.todos = [];
    state.isDemoMode = false;
    saveState();
    
    updateUI();
    showAlert('Logged out successfully', 'success');
}

/**
 * Enter demo mode
 */
function enterDemoMode() {
    state.isDemoMode = true;
    state.user = { id: 'demo', email: 'demo@example.com', name: 'Demo User' };
    state.token = 'demo-token';
    saveState();
    
    // Load demo todos
    state.todos = [
        { id: generateId(), text: 'Welcome to Todo App!', done: false },
        { id: generateId(), text: 'Try adding a new task', done: false },
        { id: generateId(), text: 'Click on tasks to mark as done', done: false },
        { id: generateId(), text: 'Use the edit and delete buttons', done: false }
    ];
    
    updateUI();
    renderTodos();
    showAlert('Demo mode activated! Try the app without signing up.', 'success');
}

// ===== Todo Functions =====

/**
 * Fetch todos from server
 */
async function fetchTodos() {
    if (state.isDemoMode) {
        renderTodos();
        return;
    }
    
    showLoading('Loading todos...');
    
    try {
        const response = await apiRequest('/api/todos');
        state.todos = response || [];
        renderTodos();
    } catch (error) {
        showAlert(error.message || 'Failed to load todos', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Add todo
 */
async function addTodo(text) {
    if (!text || text.trim() === '') return;
    
    const newTodo = {
        text: sanitizeInput(text.trim()),
        done: false
    };
    
    if (state.isDemoMode) {
        newTodo.id = generateId();
        state.todos.push(newTodo);
        renderTodos();
        todoText.value = '';
        todoText.focus();
        return;
    }
    
    showLoading('Adding task...');
    
    try {
        const response = await apiRequest('/api/todos', {
            method: 'POST',
            body: newTodo
        });
        
        state.todos.push(response);
        renderTodos();
        todoText.value = '';
        todoText.focus();
        showAlert('Task added!', 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to add task', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Toggle done status
 */
async function toggleDone(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;
    
    const newDoneStatus = !todo.done;
    
    if (state.isDemoMode) {
        todo.done = newDoneStatus;
        saveDemoTodos();
        renderTodos();
        return;
    }
    
    showLoading('Updating...');
    
    try {
        await apiRequest(`/api/todos/${id}`, {
            method: 'PATCH',
            body: { done: newDoneStatus }
        });
        
        todo.done = newDoneStatus;
        renderTodos();
    } catch (error) {
        showAlert(error.message || 'Failed to update task', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Edit todo
 */
async function editTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;
    
    const newText = prompt('Edit task:', todo.text);
    if (newText === null || newText.trim() === '') return;
    
    if (state.isDemoMode) {
        todo.text = sanitizeInput(newText.trim());
        saveDemoTodos();
        renderTodos();
        return;
    }
    
    showLoading('Updating...');
    
    try {
        await apiRequest(`/api/todos/${id}`, {
            method: 'PATCH',
            body: { text: sanitizeInput(newText.trim()) }
        });
        
        todo.text = sanitizeInput(newText.trim());
        renderTodos();
        showAlert('Task updated!', 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to update task', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Delete todo
 */
async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    if (state.isDemoMode) {
        state.todos = state.todos.filter(t => t.id !== id);
        saveDemoTodos();
        renderTodos();
        return;
    }
    
    showLoading('Deleting...');
    
    try {
        await apiRequest(`/api/todos/${id}`, {
            method: 'DELETE'
        });
        
        state.todos = state.todos.filter(t => t.id !== id);
        renderTodos();
        showAlert('Task deleted!', 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to delete task', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Clear completed todos
 */
async function clearCompleted() {
    if (!confirm('Are you sure you want to delete all completed tasks?')) return;
    
    if (state.isDemoMode) {
        state.todos = state.todos.filter(t => !t.done);
        saveDemoTodos();
        renderTodos();
        return;
    }
    
    showLoading('Clearing completed tasks...');
    
    try {
        // Delete each completed todo individually
        const completedTodos = state.todos.filter(t => t.done);
        for (const todo of completedTodos) {
            await apiRequest(`/api/todos/${todo._id || todo.id}`, {
                method: 'DELETE'
            });
        }
        
        state.todos = state.todos.filter(t => !t.done);
        renderTodos();
        showAlert(`${completedTodos.length} completed tasks cleared!`, 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to clear completed tasks', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Clear all todos
 */
async function clearAll() {
    if (!confirm('Are you sure you want to delete ALL tasks? This cannot be undone.')) return;
    
    if (state.isDemoMode) {
        state.todos = [];
        saveDemoTodos();
        renderTodos();
        return;
    }
    
    showLoading('Clearing all tasks...');
    
    try {
        await apiRequest('/api/todos', {
            method: 'DELETE'
        });
        
        state.todos = [];
        renderTodos();
        showAlert('All tasks cleared!', 'success');
    } catch (error) {
        showAlert(error.message || 'Failed to clear all tasks', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Sync todos
 */
async function syncTodos() {
    showLoading('Syncing...');
    
    try {
        await fetchTodos();
        showAlert('Synced successfully!', 'success');
    } catch (error) {
        showAlert(error.message || 'Sync failed', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Save demo todos to localStorage
 */
function saveDemoTodos() {
    try {
        localStorage.setItem('demo_todos', JSON.stringify(state.todos));
    } catch (error) {
        console.error('Error saving demo todos:', error);
    }
}

/**
 * Load demo todos from localStorage
 */
function loadDemoTodos() {
    try {
        const todos = localStorage.getItem('demo_todos');
        if (todos) {
            state.todos = JSON.parse(todos);
        }
    } catch (error) {
        console.error('Error loading demo todos:', error);
    }
}

// ===== Render Functions =====

/**
 * Render a single todo item
 */
function renderTodo(todo) {
    const isCompleted = todo.done || false;
    const id = todo._id || todo.id;
    
    return `
        <div class="todo-item ${isCompleted ? 'todo-completed' : ''}" data-id="${id}">
            <input 
                type="checkbox" 
                class="form-check-input todo-checkbox" 
                ${isCompleted ? 'checked' : ''}
                onchange="toggleDone('${id}')"
            >
            <span class="todo-text" onclick="toggleDone('${id}')">
                ${escapeHtml(todo.text)}
            </span>
            <div class="todo-actions">
                <button class="todo-action-btn edit" onclick="editTodo('${id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="todo-action-btn delete" onclick="deleteTodo('${id}')" title="Delete">
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
    if (!state.showTodos) {
        todoListContainer.style.display = 'none';
        return;
    }
    
    todoListContainer.style.display = 'block';
    
    if (state.todos.length === 0) {
        todoList.innerHTML = '';
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        todoList.innerHTML = state.todos.map(todo => renderTodo(todo)).join('');
    }
    
    updateCounters();
}

/**
 * Update counters
 */
function updateCounters() {
    const total = state.todos.length;
    const completed = state.todos.filter(t => t.done).length;
    
    todoCount.textContent = `${total} ${total === 1 ? 'task' : 'tasks'}`;
    completedCount.textContent = completed > 0 ? `(${completed} done)` : '';
}

/**
 * Update UI based on auth state
 */
function updateUI() {
    const isLoggedIn = state.token && state.user;
    
    // Toggle sections
    authSection.classList.toggle('d-none', isLoggedIn);
    appSection.classList.toggle('d-none', !isLoggedIn);
    userBar.classList.toggle('d-none', !isLoggedIn);
    serverStatus.classList.toggle('d-none', !isLoggedIn);
    
    // Update user info
    if (isLoggedIn) {
        userEmail.textContent = state.user.email;
        serverUrlDisplay.textContent = state.serverUrl;
        
        // Check server connection
        checkServerConnection().then(connected => {
            const statusBadge = document.getElementById('statusBadge');
            if (connected) {
                statusBadge.className = 'badge bg-success';
                statusBadge.textContent = 'Connected';
            } else {
                statusBadge.className = 'badge bg-warning text-dark';
                statusBadge.textContent = 'Disconnected';
            }
        });
    }
    
    // Update todo list
    renderTodos();
}

/**
 * Toggle todos visibility
 */
function toggleTodos() {
    state.showTodos = !state.showTodos;
    
    if (state.showTodos) {
        toggleText.textContent = 'Hide Todos';
        toggleTodosBtn.innerHTML = '<i class="bi bi-eye me-1"></i> <span id="toggleText">Hide Todos</span>';
        todoListContainer.style.display = 'block';
    } else {
        toggleText.textContent = 'Show Todos';
        toggleTodosBtn.innerHTML = '<i class="bi bi-eye-slash me-1"></i> <span id="toggleText">Show Todos</span>';
        todoListContainer.style.display = 'none';
    }
}

/**
 * Update server URL
 */
function updateServerUrl() {
    const newUrl = serverUrlInput.value.trim();
    if (!newUrl) {
        showAlert('Please enter a valid URL', 'danger');
        return;
    }
    
    state.serverUrl = newUrl;
    saveState();
    serverModal.hide();
    
    // Update display
    serverUrlDisplay.textContent = state.serverUrl;
    
    // Check connection
    checkServerConnection().then(connected => {
        const statusBadge = document.getElementById('statusBadge');
        if (connected) {
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Connected';
            showAlert('Server updated and connected!', 'success');
        } else {
            statusBadge.className = 'badge bg-warning text-dark';
            statusBadge.textContent = 'Disconnected';
            showAlert('Server updated but connection failed', 'warning');
        }
    });
}

// ===== Event Listeners =====

// Login form
document.addEventListener('DOMContentLoaded', () => {
    // Load state
    loadState();
    
    // If demo mode, load demo todos
    if (state.isDemoMode) {
        loadDemoTodos();
    }
    
    // Update UI
    updateUI();
    
    // Auth forms
    loginFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
    
    signupFormElement.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        signup(name, email, password);
    });
    
    // Try demo
    tryDemoBtn.addEventListener('click', enterDemoMode);
    
    // Logout
    logoutBtn.addEventListener('click', logout);
    
    // Todo form
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(todoText.value);
    });
    
    // Add todo on Enter
    todoText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTodo(todoText.value);
        }
    });
    
    // Toggle todos
    toggleTodosBtn.addEventListener('click', toggleTodos);
    
    // Bulk actions
    clearCompletedBtn.addEventListener('click', clearCompleted);
    clearAllBtn.addEventListener('click', clearAll);
    syncBtn.addEventListener('click', syncTodos);
    
    // Server config
    changeServerBtn.addEventListener('click', () => {
        serverUrlInput.value = state.serverUrl;
        serverModal.show();
    });
    
    saveServerBtn.addEventListener('click', updateServerUrl);
    
    // Auto-focus
    if (state.token && state.user) {
        todoText.focus();
    } else {
        document.getElementById('loginEmail').focus();
    }
    
    // Tab switching
    const authTabs = document.querySelectorAll('#authTabs button');
    authTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', () => {
            // Focus first input in the active tab
            const activePane = document.querySelector('.tab-pane.active');
            const firstInput = activePane.querySelector('input');
            if (firstInput) firstInput.focus();
        });
    });
});

// ===== Make functions globally available =====
window.toggleDone = toggleDone;
window.editTodo = editTodo;
window.deleteTodo = deleteTodo;
