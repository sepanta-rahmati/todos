// ===== Utility Functions =====

/**
 * Generate a unique UUID v4
 * @returns {string} UUID v4 string
 */
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
    if (!input) return '';
    return input.toString()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate todo text
 * @param {string} text - The text to validate
 * @returns {Object} Validation result with isValid and message
 */
function validateText(text) {
    if (!text || text.trim() === '') {
        return { isValid: false, message: 'Task text is required' };
    }
    if (text.length > 500) {
        return { isValid: false, message: 'Task text must be less than 500 characters' };
    }
    // Check for potentially dangerous content
    const dangerousPatterns = [/<script/gi, /javascript:/gi, /onerror=/gi, /onload=/gi];
    for (const pattern of dangerousPatterns) {
        if (pattern.test(text)) {
            return { isValid: false, message: 'Task text contains invalid content' };
        }
    }
    return { isValid: true, message: '' };
}

/**
 * Format date for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return '';
    }
}

/**
 * Check if date is overdue
 * @param {string|Date} date - The date to check
 * @returns {string} CSS class for styling
 */
function getDueDateClass(date) {
    if (!date) return '';
    try {
        const dueDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) return 'due-overdue';
        if (daysDiff <= 2) return 'due-soon';
        return '';
    } catch {
        return '';
    }
}

/**
 * Get priority badge HTML
 * @param {string} priority - The priority level
 * @returns {string} HTML for priority badge
 */
function getPriorityBadge(priority) {
    const priorities = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
    };
    const label = priorities[priority] || 'Low';
    return `<span class="badge priority-badge priority-${priority}">${label}</span>`;
}

/**
 * Get category badge HTML
 * @param {string} category - The category
 * @returns {string} HTML for category badge
 */
function getCategoryBadge(category) {
    const categories = {
        personal: 'Personal',
        work: 'Work',
        study: 'Study',
        shopping: 'Shopping',
        other: 'Other'
    };
    const label = categories[category] || 'Other';
    return `<span class="badge category-badge category-${category}">${label}</span>`;
}

/**
 * Get status badge HTML
 * @param {boolean} done - The done status
 * @returns {string} HTML for status badge
 */
function getStatusBadge(done) {
    const status = done ? 'Done' : 'Pending';
    const className = done ? 'status-done' : 'status-pending';
    return `<span class="badge status-badge ${className}">${status}</span>`;
}

/**
 * Get tags HTML
 * @param {string|Array} tags - The tags
 * @returns {string} HTML for tags
 */
function getTagsHtml(tags) {
    if (!tags) return '';
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(t => t);
    if (tagArray.length === 0) return '<span class="text-muted">-</span>';
    return tagArray.map(tag => `<span class="tag-badge">${escapeHtml(tag)}</span>`).join('');
}

// ===== Todo Management =====

let todos = JSON.parse(window.localStorage.getItem('todos')) || [];

/**
 * Save todos to localStorage with error handling
 */
function save() {
    try {
        window.localStorage.setItem('todos', JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos:', error);
        showAlert('Error saving todos. Storage may be full.', 'danger');
    }
}

/**
 * Add a new todo or update existing
 * @param {Object} todo - The todo to add or update
 * @param {boolean} isUpdate - Whether this is an update
 */
function addTodo(todo, isUpdate = false) {
    const validation = validateText(todo.text);
    if (!validation.isValid) {
        showAlert(validation.message, 'danger');
        return null;
    }
    
    const newTodo = {
        id: todo.id || uuidv4(),
        text: sanitizeInput(todo.text.trim()),
        done: Boolean(todo.done),
        priority: todo.priority || 'low',
        category: todo.category || 'personal',
        tags: todo.tags || '',
        dueDate: todo.dueDate || '',
        createdAt: isUpdate ? todo.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (!isUpdate) {
        todos.push(newTodo);
    }
    
    save();
    return newTodo;
}

/**
 * Render a single todo item
 * @param {Object} todo - The todo to render
 * @returns {string} HTML for the todo item
 */
function renderTodo(todo) {
    const dueDateClass = getDueDateClass(todo.dueDate);
    const dueDateText = formatDate(todo.dueDate) || '-';
    const completedClass = todo.done ? 'completed-task' : '';
    
    return `
        <tr id="${todo.id}" class="todo-item ${completedClass}">
            <td class="text-center">
                <input type="checkbox" ${todo.done ? 'checked' : ''} 
                       onchange="toggleDone('${todo.id}')" 
                       class="form-check-input" />
            </td>
            <td>
                <div class="fw-semibold">${escapeHtml(todo.text)}</div>
                <div class="text-muted small">
                    Created: ${formatDate(todo.createdAt)}
                    ${todo.updatedAt !== todo.createdAt ? ` | Updated: ${formatDate(todo.updatedAt)}` : ''}
                </div>
            </td>
            <td class="text-center">
                ${getPriorityBadge(todo.priority)}
            </td>
            <td class="text-center">
                ${getCategoryBadge(todo.category)}
            </td>
            <td class="text-center due-date ${dueDateClass}">
                ${dueDateText}
            </td>
            <td class="text-center">
                ${getTagsHtml(todo.tags)}
            </td>
            <td class="text-center">
                <i class="bi bi-pencil-square text-primary edit-icon me-2" 
                   onclick="editTodo('${todo.id}')" 
                   title="Edit"></i>
                <i class="bi bi-trash text-danger delete-icon" 
                   onclick="deleteTodo('${todo.id}')" 
                   title="Delete"></i>
            </td>
        </tr>
    `;
}

/**
 * Render all todos
 */
function renderTodos() {
    const list = document.getElementById('list');
    const filteredTodos = applyFilters();
    
    if (filteredTodos.length === 0) {
        list.innerHTML = `
            <tr class="text-center">
                <td colspan="7" class="py-4 text-muted">
                    <i class="bi bi-inbox fs-1 mb-2"></i>
                    <p>No tasks match your filters. Try adjusting your search.</p>
                </td>
            </tr>
        `;
    } else {
        list.innerHTML = filteredTodos.map(todo => renderTodo(todo)).join('');
    }
    
    updateCounters();
}

/**
 * Apply search and filters to todos
 * @returns {Array} Filtered todos
 */
function applyFilters() {
    const searchText = document.getElementById('search')?.value.toLowerCase() || '';
    const filterPriority = document.getElementById('filter-priority')?.value || '';
    const filterCategory = document.getElementById('filter-category')?.value || '';
    const filterStatus = document.getElementById('filter-status')?.value || '';
    
    return todos.filter(todo => {
        // Search filter
        const matchesSearch = !searchText || 
            todo.text.toLowerCase().includes(searchText) ||
            (todo.tags && todo.tags.toLowerCase().includes(searchText)) ||
            todo.category.toLowerCase().includes(searchText) ||
            todo.priority.toLowerCase().includes(searchText);
        
        // Priority filter
        const matchesPriority = !filterPriority || todo.priority === filterPriority;
        
        // Category filter
        const matchesCategory = !filterCategory || todo.category === filterCategory;
        
        // Status filter
        let matchesStatus = true;
        if (filterStatus === 'done') {
            matchesStatus = todo.done;
        } else if (filterStatus === 'pending') {
            matchesStatus = !todo.done;
        }
        
        return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
    });
}

/**
 * Update todo counters
 */
function updateCounters() {
    const totalCount = todos.length;
    const completedCount = todos.filter(t => t.done).length;
    
    document.getElementById('todo-count').textContent = totalCount;
    document.getElementById('completed-count').textContent = `(${completedCount} completed)`;
}

// ===== Todo Operations =====

function toggleDone(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.done = !todo.done;
        todo.updatedAt = new Date().toISOString();
        save();
        renderTodos();
    }
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const form = document.getElementById('addtodo');
    const formTitle = document.getElementById('form-title');
    const cancelBtn = document.getElementById('cancel-btn');
    
    // Update form title
    formTitle.textContent = 'Edit Todo';
    cancelBtn.style.display = 'inline-block';
    
    // Populate form
    form.elements.id.value = todo.id;
    form.elements.text.value = todo.text;
    form.elements.priority.value = todo.priority || 'low';
    form.elements.category.value = todo.category || 'personal';
    form.elements.tags.value = todo.tags || '';
    form.elements.dueDate.value = todo.dueDate || '';
    form.elements.done.checked = todo.done;
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        todos = todos.filter(t => t.id !== id);
        save();
        renderTodos();
        showAlert('Task deleted successfully', 'success');
    }
}

// ===== Form Handling =====

const form = document.getElementById('addtodo');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    
    const id = formData.get('id');
    const text = formData.get('text')?.trim() || '';
    const done = Boolean(formData.get('done'));
    const priority = formData.get('priority') || 'low';
    const category = formData.get('category') || 'personal';
    const tags = formData.get('tags')?.trim() || '';
    const dueDate = formData.get('dueDate') || '';
    
    // Validate
    const validation = validateText(text);
    if (!validation.isValid) {
        showAlert(validation.message, 'danger');
        return;
    }
    
    if (id) {
        // Update existing todo
        const todoIndex = todos.findIndex(t => t.id === id);
        if (todoIndex !== -1) {
            todos[todoIndex] = {
                ...todos[todoIndex],
                text: sanitizeInput(text),
                done,
                priority,
                category,
                tags,
                dueDate,
                updatedAt: new Date().toISOString()
            };
            save();
            renderTodos();
            showAlert('Task updated successfully', 'success');
        }
    } else {
        // Add new todo
        if (text) {
            const todo = addTodo({
                text,
                done,
                priority,
                category,
                tags,
                dueDate
            });
            
            if (todo) {
                renderTodos();
                showAlert('Task added successfully', 'success');
            }
        }
    }
    
    resetForm();
});

// Cancel edit
const cancelBtn = document.getElementById('cancel-btn');
cancelBtn.addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    form.reset();
    form.elements.id.value = '';
    document.getElementById('form-title').textContent = 'Add New Todo';
    cancelBtn.style.display = 'none';
}

// ===== Filter Handling =====

function setupFilters() {
    const searchInput = document.getElementById('search');
    const filterPriority = document.getElementById('filter-priority');
    const filterCategory = document.getElementById('filter-category');
    const filterStatus = document.getElementById('filter-status');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Add event listeners
    searchInput?.addEventListener('input', () => renderTodos());
    filterPriority?.addEventListener('change', () => renderTodos());
    filterCategory?.addEventListener('change', () => renderTodos());
    filterStatus?.addEventListener('change', () => renderTodos());
    
    clearFiltersBtn?.addEventListener('click', () => {
        searchInput.value = '';
        filterPriority.value = '';
        filterCategory.value = '';
        filterStatus.value = '';
        renderTodos();
    });
}

// ===== Bulk Operations =====

function setupBulkOperations() {
    const clearCompletedBtn = document.getElementById('clear-completed');
    const clearAllBtn = document.getElementById('clear-all');
    const exportBtn = document.getElementById('export-json');
    const importBtn = document.getElementById('import-json');
    const importFile = document.getElementById('import-file');
    
    clearCompletedBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all completed tasks?')) {
            todos = todos.filter(t => !t.done);
            save();
            renderTodos();
            showAlert('All completed tasks cleared', 'success');
        }
    });
    
    clearAllBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
            todos = [];
            save();
            renderTodos();
            showAlert('All tasks cleared', 'success');
        }
    });
    
    exportBtn?.addEventListener('click', () => {
        const data = JSON.stringify(todos, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'todos-export-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showAlert('Todos exported successfully', 'success');
    });
    
    importBtn?.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                if (!Array.isArray(importedTodos)) {
                    throw new Error('Invalid format');
                }
                
                // Validate imported todos
                const validTodos = importedTodos.filter(todo => 
                    todo && typeof todo === 'object' && validateText(todo.text || '').isValid
                );
                
                if (validTodos.length === 0) {
                    showAlert('No valid todos found in the file', 'danger');
                    return;
                }
                
                // Merge with existing todos
                todos = [...todos, ...validTodos];
                save();
                renderTodos();
                showAlert(`${validTodos.length} todos imported successfully`, 'success');
            } catch (error) {
                console.error('Error importing todos:', error);
                showAlert('Error importing todos. Please check the file format.', 'danger');
            } finally {
                importFile.value = '';
            }
        };
        reader.readAsText(file);
    });
}

// ===== Alert System =====

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    // Clear previous alerts
    alertContainer.innerHTML = '';
    
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
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const currentAlert = alertContainer.querySelector('.alert');
        if (currentAlert) {
            currentAlert.classList.remove('show');
            setTimeout(() => currentAlert.remove(), 150);
        }
    }, 5000);
}

// ===== Keyboard Shortcuts =====

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + Enter to submit form
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            const form = document.getElementById('addtodo');
            if (form.checkValidity()) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape to reset form
        if (event.key === 'Escape') {
            resetForm();
        }
    });
}

// ===== Auto-save =====

let autoSaveTimeout;

function setupAutoSave() {
    const form = document.getElementById('addtodo');
    form.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = new FormData(form);
            const id = formData.get('id');
            if (id) {
                // Only auto-save for existing todos
                const text = formData.get('text')?.trim() || '';
                const validation = validateText(text);
                if (validation.isValid) {
                    const todo = todos.find(t => t.id === id);
                    if (todo) {
                        todo.text = sanitizeInput(text);
                        todo.updatedAt = new Date().toISOString();
                        save();
                    }
                }
            }
        }, 2000); // Auto-save after 2 seconds of inactivity
    });
}

// ===== LocalStorage Monitoring =====

function setupStorageMonitoring() {
    window.addEventListener('storage', (event) => {
        if (event.key === 'todos') {
            try {
                todos = JSON.parse(event.newValue) || [];
                renderTodos();
            } catch {
                // Ignore parsing errors
            }
        }
    });
}

// ===== Initialize =====

function init() {
    // Load todos
    try {
        todos = JSON.parse(window.localStorage.getItem('todos')) || [];
    } catch (error) {
        console.error('Error loading todos:', error);
        todos = [];
        showAlert('Error loading saved todos. Starting with empty list.', 'warning');
    }
    
    // Setup event listeners
    setupFilters();
    setupBulkOperations();
    setupKeyboardShortcuts();
    setupAutoSave();
    setupStorageMonitoring();
    
    // Initial render
    renderTodos();
    
    // Welcome message for first-time users
    if (todos.length === 0) {
        setTimeout(() => {
            showAlert('Welcome! Add your first task to get started.', 'info');
        }, 500);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available for onclick handlers
window.toggleDone = toggleDone;
window.editTodo = editTodo;
window.deleteTodo = deleteTodo;
