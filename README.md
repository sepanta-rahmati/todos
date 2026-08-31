# Todo App

A feature-rich, responsive todo application for organizing your tasks efficiently.

## Features

### Core Features
- **Add/Edit/Delete Todos**: Full CRUD operations
- **Mark as Complete**: Toggle task completion status
- **Persistent Storage**: All todos saved to browser's localStorage

### Advanced Features
- **Priority Levels**: Low, Medium, High, Urgent
- **Categories**: Personal, Work, Study, Shopping, Other
- **Tags**: Add multiple tags to each todo
- **Due Dates**: Set deadlines for your tasks
- **Rich Text**: Support for task descriptions

### Search & Filter
- **Text Search**: Search across task text and tags
- **Priority Filter**: Filter by priority level
- **Category Filter**: Filter by category
- **Status Filter**: Filter by completion status
- **Clear Filters**: One-click filter reset

### User Experience
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Mode Support**: Automatic dark mode detection
- **Animations**: Smooth transitions and fade effects
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter`: Submit form
  - `Escape`: Reset form
- **Auto-save**: Drafts auto-save after 2 seconds of inactivity

### Data Management
- **Export to JSON**: Download all todos as JSON file
- **Import from JSON**: Load todos from JSON file
- **Bulk Actions**: Clear completed or all todos
- **Real-time Updates**: Changes saved instantly

### Security
- **XSS Protection**: All inputs sanitized and escaped
- **Input Validation**: Text length and content validation
- **Storage Error Handling**: Graceful handling of storage issues

## Tech Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with animations
- **JavaScript (ES6+)**: Vanilla JavaScript, no framework dependencies
- **Bootstrap 5**: Responsive grid and components
- **Bootstrap Icons**: Icon library
- **Luxon**: Date handling (loaded via CDN)
- **UUID**: Unique ID generation

## Installation

### Option 1: Direct Use

1. Download or clone the repository
2. Open `index.html` in your web browser
3. That's it! No server required.

### Option 2: Local Server

For better development experience:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Connect to Backend

To use with the [todos-server](../todos-server):

1. Start the server (see todos-server README)
2. Update the frontend to point to your server URL
3. The app will automatically sync with the backend

## Usage

### Adding a Todo
1. Fill in the task description (required)
2. Optionally set:
   - Priority level
   - Category
   - Tags (comma-separated)
   - Due date
   - Completion status
3. Click "Save" or press `Ctrl+Enter`

### Editing a Todo
1. Click the edit icon (pencil) on any todo
2. Make your changes
3. Click "Save" or press `Ctrl+Enter`
4. Click "Cancel" or press `Escape` to discard changes

### Deleting a Todo
1. Click the delete icon (trash can) on any todo
2. Confirm the deletion in the dialog

### Searching and Filtering
1. Use the search box to find todos by text or tags
2. Use the dropdowns to filter by priority, category, or status
3. Click "Clear" to reset all filters

### Bulk Actions
- **Clear Completed**: Remove all completed todos
- **Clear All**: Remove all todos (with confirmation)
- **Export**: Download all todos as JSON
- **Import**: Load todos from a JSON file

## Todo Object Structure

```json
{
  "id": "string",           // Unique identifier (UUID v4)
  "text": "string",         // Task description (required, max 500 chars)
  "done": "boolean",        // Completion status
  "priority": "string",     // One of: low, medium, high, urgent
  "category": "string",     // One of: personal, work, study, shopping, other
  "tags": "string",         // Comma-separated tags
  "dueDate": "string",      // Date string (YYYY-MM-DD)
  "createdAt": "string",    // Creation timestamp (ISO 8601)
  "updatedAt": "string"     // Last update timestamp (ISO 8601)
}
```

## File Structure

```
todos/
├── index.html          # Main HTML file
├── script.js           # JavaScript logic
├── style.css           # Custom styles
└── README.md           # This file
```

## Customization

### Changing Colors
Edit `style.css` to modify:
- Priority colors (low, medium, high, urgent)
- Category colors (personal, work, study, shopping, other)
- Status colors (done, pending)

### Adding More Categories
1. Add option to the category select in `index.html`
2. Add corresponding color in `style.css`
3. Update the category badge function in `script.js`

### Adding More Priorities
1. Add option to the priority select in `index.html`
2. Add corresponding color in `style.css`
3. Update the priority badge function in `script.js`

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

Note: Requires modern browser with ES6+ support.

## Security Considerations

- All user inputs are sanitized and escaped to prevent XSS attacks
- Input validation prevents potentially dangerous content
- localStorage is used for persistence (limited to ~5MB per domain)
- No external API calls (except Bootstrap and icons from CDN)

## Performance

- Minimal JavaScript bundle (no heavy frameworks)
- Efficient DOM updates (only re-renders affected elements)
- Debounced auto-save to prevent excessive writes
- Lazy loading of resources

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Enter` | Submit form |
| `Escape` | Reset form / Cancel edit |

## Troubleshooting

### Todos not saving?
- Check if localStorage is available in your browser
- Verify there's enough storage space
- Check browser console for errors

### Styles not loading?
- Ensure internet connection for Bootstrap CDN
- Check for ad-blockers that might block CDN resources

### App not working?
- Try clearing browser cache
- Open browser console (F12) to see errors
- Ensure JavaScript is enabled

## Development

### Running Locally
```bash
# Clone the repository
git clone <repository-url>
cd todos

# Open index.html in browser
open index.html
```

### Testing Changes
1. Make changes to files
2. Refresh browser to see updates
3. Check console for errors

### Linting
The frontend uses vanilla JavaScript and doesn't require linting tools, but you can use:
- ESLint for JavaScript
- Stylelint for CSS

## Connecting to Backend

To connect to the [todos-server](../todos-server):

1. Start the server:
```bash
cd ../todos-server
npm install
npm start
```

2. Modify `script.js` to use the API:
```javascript
// Change from localStorage to API calls
// Example for fetching todos:
fetch('http://localhost:3000/api/todos')
  .then(response => response.json())
  .then(todos => {
    // Render todos
  });
```

3. Add authentication headers when needed

## API Integration Example

```javascript
// Configuration
const API_BASE = 'http://localhost:3000/api';
const TOKEN = localStorage.getItem('token');

// Headers for authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

// Fetch todos
async function fetchTodos() {
  const response = await fetch(`${API_BASE}/todos`, { headers });
  return await response.json();
}

// Create todo
async function createTodo(todo) {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(todo)
  });
  return await response.json();
}

// Update todo
async function updateTodo(id, todo) {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(todo)
  });
  return await response.json();
}

// Delete todo
async function deleteTodo(id) {
  await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
    headers
  });
}
```

## Version History

- **v2.0.0**: Complete rewrite with advanced features
  - Added priority, categories, tags, due dates
  - Added search and filtering
  - Added export/import functionality
  - Enhanced UI with animations
  - Added XSS protection and validation
  - Added keyboard shortcuts
  - Added dark mode support
  - Added auto-save feature

- **v1.0.0**: Initial release
  - Basic todo CRUD operations
  - localStorage persistence
  - Simple UI with Bootstrap

## License

ISC

## Related Projects

- [todos-server](../todos-server) - Backend API server for this app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- [Bootstrap](https://getbootstrap.com/) - CSS framework
- [Bootstrap Icons](https://icons.getbootstrap.com/) - Icon library
- [Luxon](https://moment.github.io/luxon/) - Date handling
- [UUID](https://github.com/uuidjs/uuid) - ID generation
