# dot-js Frontend Framework

> A lightweight, modern, zero-dependency front-end framework built completely from scratch in vanilla JavaScript.

---

## 1. Overview & Architectural Blueprint

`dot-js` is designed to eliminate "JavaScript fatigue" by providing a transparent, predictable, and robust foundation for building single-page web applications (SPAs) without any third-party UI libraries (no React, Vue, Angular, or Svelte).

### Framework vs. Library (Inversion of Control)
A library provides helper functions that your application code calls on demand. In contrast, `dot-js` is a **true framework**:
- **Inversion of Control (IoC)**: `createApp()` takes ownership of the application lifecycle. It configures the centralized event delegator, synchronizes the SPA client router, connects the reactive state store, schedules reconciliation cycles, and renders component trees to the DOM.
- **Declarative Representation**: Developers describe *what* the user interface looks like at any point in time using Virtual DOM nodes (`h()`), while `dot-js` figures out *how* to surgically apply mutations to the real browser DOM.

```
+-------------------------------------------------------------------+
|                        dot-js Application                         |
+-------------------------------------------------------------------+
|  [SPA Router] <---> [Reactive Store] <---> [HTTP Client]          |
|         |                  |                      |               |
|         v                  v                      v               |
|   Active View         App State             Remote Data           |
|         |                  |                                      |
|         +--------> [Render Function]                              |
|                            |                                      |
|                            v                                      |
|                  Virtual DOM Tree (h())                           |
|                            |                                      |
|                            v                                      |
|             [Keyed Diffing & Reconciliation]                      |
|                            |                                      |
|                            v                                      |
|        [Microtask Scheduler (queueMicrotask)]                     |
|                            |                                      |
|                            v                                      |
|         Live DOM Tree (Root Event Delegation)                     |
+-------------------------------------------------------------------+
```

---

## 2. Installation & Setup

Because `dot-js` is built with modern ES Modules, no build tools, bundlers, or transpilers are required.

### Directory Convention
Ensure your project contains two root folders:
```
my-project/
├── framework/       # Framework source code & documentation
│   ├── src/
│   │   ├── vdom/
│   │   ├── events/
│   │   ├── state/
│   │   ├── router/
│   │   ├── http/
│   │   └── index.js
│   └── README.md
└── example/         # Showcase application (e.g., Kanban Board)
    ├── index.html
    ├── styles/
    └── src/
```

### Import into Any ES Module
```javascript
import {
  createApp,
  createStore,
  createRouter,
  h,
  http
} from '../framework/src/index.js';
```

---

## 3. Getting Started Guide

Here is a minimal, complete "Hello World" counter application to get started in under 60 seconds:

### 1. Create `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>dot-js Quickstart</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

### 2. Create `main.js`
```javascript
import { createApp, createStore, h } from '../framework/src/index.js';

// 1. Define Reactive State Store
const store = createStore({
  initialState: { count: 0 },
  actions: {
    increment({ state, setState }) {
      setState({ count: state.count + 1 });
    },
    decrement({ state, setState }) {
      setState({ count: state.count - 1 });
    }
  }
});

// 2. Initialize Framework Application
const app = createApp({
  root: '#app',
  store,
  render({ state, dispatch }) {
    return h('div', { class: 'counter-card' },
      h('h1', null, `Counter: ${state.count}`),
      h('button', { 'on:click': () => dispatch('decrement') }, 'Decrement'),
      h('button', { 'on:click': () => dispatch('increment') }, 'Increment')
    );
  }
});

// 3. Mount Application (IoC begins)
app.mount();
```

---

## 4. Feature Reference & Code Examples

### 4.1 Virtual DOM & Hyperscript (`h()`)
Construct virtual DOM nodes programmatically without fragile HTML template string concatenation:

```javascript
import { h } from './framework/src/index.js';

const card = h('article', { class: 'task-card', dataset: { id: '42' } },
  h('h2', { class: 'title' }, 'Implement Routing'),
  h('p', null, 'Route parameters and history integration.'),
  h('ul', null,
    ['Item 1', 'Item 2'].map(item => h('li', { key: item }, item))
  )
);
```

### 4.2 Attributes, Styles, and Class Manipulation
Styles and classes support both objects and arrays:
```javascript
h('div', {
  id: 'status-box',
  class: ['badge', isUrgent && 'urgent'],
  style: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    padding: '8px 16px',
    borderRadius: '4px'
  }
}, 'Active Task');
```

### 4.3 Centralized Event Delegation & Modifiers
Rather than binding individual `addEventListener` listeners to every single DOM node, `dot-js` attaches high-level listeners to the root element. Events bubble to the root and are dispatched to the target handler.

Event modifiers allow declarative control over default browser behavior:
```javascript
// Automatically calls event.preventDefault()
h('form', { 'on:submit:prevent': handleFormSubmit },
  h('input', { type: 'text', name: 'title', 'on:input': handleInputChange }),
  h('button', { type: 'submit' }, 'Save')
);

// Automatically stops event propagation
h('button', { 'on:click:stop': handleChildClick }, 'Do Not Bubble');
```

### 4.4 Controlled Forms & User Input
`dot-js` handles controlled inputs and form serialization with zero boilerplate:
```javascript
function TaskForm({ onSave }) {
  function onSubmit(event) {
    const form = event.target;
    const title = form.elements['title'].value;
    const priority = form.elements['priority'].value;
    onSave({ title, priority });
  }

  return h('form', { 'on:submit:prevent': onSubmit },
    h('label', null, 'Task Title'),
    h('input', { name: 'title', required: true }),
    h('select', { name: 'priority' },
      h('option', { value: 'High' }, 'High'),
      h('option', { value: 'Medium', selected: true }, 'Medium'),
      h('option', { value: 'Low' }, 'Low')
    ),
    h('button', { type: 'submit' }, 'Add Task')
  );
}
```

### 4.5 Reactive State Store (`createStore`)
A centralized state store with action dispatching and microtask update batching:
```javascript
const store = createStore({
  initialState: {
    tasks: [],
    filter: 'All'
  },
  actions: {
    setFilter({ setState }, filter) {
      setState({ filter });
    },
    async loadTasks({ setState }) {
      const res = await http.get('/api/tasks');
      if (res.ok) setState({ tasks: res.data });
    }
  }
});
```

### 4.6 Cross-Element & Cross-Page State Sharing
Because the store is globally subscribed by the application root, any decoupled component or view can dispatch actions or read slices of the state. Changes made on one page (e.g. adding a task on `/`) are immediately reflected on other pages (e.g. `/analytics` or `/task/:id`).

### 4.7 Cross-Session Persistence (`StorageAdapter`)
To automatically persist state across page reloads and browser sessions, specify `persistKey`:
```javascript
const store = createStore({
  persistKey: 'kanban_board_session',
  storageType: 'local', // 'local' or 'session'
  initialState: { tasks: [] }
});
```
On boot, `dot-js` automatically hydrates state from `localStorage` if available.

### 4.8 Client-Side SPA Router (`createRouter`)
Full SPA routing supporting dynamic parameters (`:id`), hash navigation, and programmatic redirects:
```javascript
const router = createRouter({
  routes: [
    { path: '/', component: BoardView, title: 'dot-js Kanban Board' },
    { path: '/benchmark', component: BenchmarkView, title: 'dot-js Performance Benchmark' }
  ],
  mode: 'hash'
});

// Programmatic navigation:
router.navigate('/benchmark');

// Navigating back:
router.navigate('/');
```

### 4.9 Built-in HTTP Client (`http`)
Unified fetch abstraction handling JSON parsing, standard envelopes, headers, and error states:
```javascript
import { http } from './framework/src/index.js';

// GET request
const { ok, data, error } = await http.get('/api/tasks');

// POST request with automatic JSON serialization
const res = await http.post('/api/tasks', {
  content: '**New Feature**\nSupport dark theme',
  column: 'Backlog'
});

// PUT request
await http.put(`/api/tasks/${id}`, { completed: true });

// DELETE request
await http.delete(`/api/tasks/${id}`);
```

---

## 5. Performance Engineering & Benchmarks

Performance was a core priority during the architectural design of `dot-js`.

### Key Performance Decisions
1. **Positional Keyed Reconciliation Algorithm (`diff.js`)**:
   - When reconciling lists of cards, `dot-js` uses keyed diffing with precise positional checking:
     ```javascript
     const currentDomNode = parentEl.childNodes[i];
     if (currentDomNode !== newChild.el) {
       parentEl.insertBefore(newChild.el, currentDomNode || null);
     }
     ```
   - If an element is already in the correct index position, zero DOM mutations are made. When reordering cards, `insertBefore` accurately moves existing DOM nodes with surgical efficiency without thrashing the DOM.
2. **Microtask Update Batching (`scheduler.js`)**:
   - Calling `setState()` multiple times in quick succession does not trigger multiple re-renders.
   - Updates are scheduled via `queueMicrotask()`, coalescing multiple state dispatches into a single render and patch cycle per microtask turn.
3. **Root-Level Event Delegation (`delegator.js`)**:
   - Instead of binding hundreds of event listeners to cards and buttons, `dot-js` registers single listeners on the mount root (`#app`) for each event type and uses a WeakMap lookup to dispatch synthetic events.
4. **DOM Stability During Drag & Drop**:
   - Rather than inserting and removing placeholder DOM nodes during drag operations (which causes native drag ghosts to collapse and flutter in Chromium), `dot-js` uses non-destructive visual drop indicators (`.drop-before` and `.drop-after` CSS borders), keeping the DOM node count stable and drag operations completely jitter-free.

### Empirical Validation Suite
The application includes a dedicated **Benchmark View** (`#/benchmark`). Navigating to `#/benchmark` allows running live tests against 1,000, 3,000, and 5,000 cards:
- **1,000 Cards**: ~5ms - 12ms mount, ~4ms - 8ms diff
- **3,000 Cards**: ~14ms - 22ms mount, ~15ms - 25ms diff
- **5,000 Cards**: ~24ms - 35ms mount, ~16ms - 30ms diff
- **View Isolation**: All benchmark cards are rendered in an isolated test environment and never pollute or touch the active Kanban board tasks.

---

## 6. Best Practices & Guidelines

1. **Always Provide Keys for List Items**:
   ```javascript
   // Good
   items.map(item => h('div', { key: item.id }, item.name))
   // Avoid
   items.map(item => h('div', null, item.name))
   ```
2. **Encapsulate Domain Logic in Store Actions**:
   Keep components purely declarative. Dispatch actions to the store instead of mutating state locally.
3. **Use Event Delegation Modifiers**:
   Use `'on:submit:prevent'` on `<form>` elements to cleanly handle submissions without manual `e.preventDefault()`, or `'on:click:stop'` to stop propagation.
4. **Clean Component Composition**:
   Build small, reusable components (Card, Column, Header) and pass handlers as props.

---

## 7. Reviewer Guide: Adding a Feature in 5 Minutes

To demonstrate how straightforward it is to expand `dot-js` applications, here is a quick guide to adding a **"Clear All Done Cards"** quick action button to the Header:

### Step 1: Add Store Action (`example/src/store/boardStore.js`)
Add this action inside `actions`:
```javascript
clearAllDoneCards({ state, setState }) {
  setState({
    tasks: state.tasks.filter(t => !t.completed)
  });
}
```

### Step 2: Add Button in Header (`example/src/components/Header.js`)
Inside the `header-actions` div of `Header.js`, add:
```javascript
h('button', {
  class: 'btn btn-secondary btn-sm',
  'on:click': onClearDone
}, 'Clear Done')
```
And add `onClearDone` to `Header({ route, onNavigate, onAddList, onClearDone })`.

### Step 3: Wire in Main Application (`example/src/main.js`)
Pass `onClearDone: () => dispatch('clearAllDoneCards')` into `Header(...)`.

Save and refresh `http://localhost:3000/example/#/`. The button will immediately clear all completed cards across all columns and reactively update the board.
