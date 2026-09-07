# dot-js Frontend Framework

> A lightweight, zero-dependency modern front-end framework built from scratch in vanilla JavaScript, accompanied by an Obsidian-style minimalist Kanban Board showcase application.

---

## 1. About This Repository

This repository contains **dot-js**: a custom client-side web framework engineered without any third-party UI libraries (no React, Vue, Angular, or Svelte), designed to demonstrate the core mechanics of modern front-end architecture—including Virtual DOM abstraction, keyed reconciliation, centralized event delegation, reactive state stores, client-side SPA routing, and HTTP abstractions.

Alongside the framework source code, this repository includes an example showcase project: a **Minimalist Markdown Kanban Board** that exercises all framework capabilities in a real-world, interactive single-page application.

---

## 2. Repository Structure

```
frontend-framework/
├── README.md               # Repository overview and quickstart guide (this file)
├── framework/              # Core framework source, tests, and documentation
│   ├── README.md           # Comprehensive framework architecture & API documentation
│   ├── src/
│   │   ├── vdom/           # Virtual DOM engine (h, mount, patch, unmount, component)
│   │   ├── events/         # Centralized root event delegation & modifiers
│   │   ├── state/          # Reactive store, microtask batch scheduler, storage adapter
│   │   ├── router/         # Client-side SPA hash router with dynamic parameters
│   │   ├── http/           # Fetch-based HTTP client abstraction
│   │   ├── perf/           # Benchmark and telemetry measurement utilities
│   │   ├── app.js          # Inversion-of-control application container (createApp)
│   │   └── index.js        # Main barrel export
│   └── test/
│       └── run-tests.js    # Node-based automated unit test runner
└── example/                # Showcase application: Minimalist Kanban Board
    ├── index.html          # Application HTML shell
    ├── package.json        # Example project metadata
    ├── styles/
    │   └── main.css        # Minimalist Obsidian-style design system
    └── src/
        ├── main.js         # Application bootstrap & SPA route configuration
        ├── components/     # Reusable UI components (Header, Column, Card)
        ├── views/          # Route views (BoardView, BenchmarkView)
        ├── store/          # Central board state store & actions
        ├── utils/          # Lightweight markdown-to-VDOM parser
        └── api/            # Simulated backend REST mock server
```

---

## 3. The Showcase Application: Kanban Board

The example application is a **Minimalist Markdown Kanban Board** inspired by Obsidian's Kanban plugin:

- **Markdown-First Cards**: Full support for inline markdown, including headings (`#`), bold (`**text**`), inline code (`` `code` ``), bullet lists (`- item`), checkboxes (`- [ ] / - [x]`), and hashtag badges (`#tag`).
- **Interactive Drag & Drop**: Native HTML5 drag-and-drop card reordering within the same column and across columns. Uses non-destructive indicator styling (`.drop-before` and `.drop-after`) to ensure native drag ghosts remain completely stable and jitter-free.
- **In-Place Editing**: Double-click any card to edit its markdown content with `Ctrl+Enter` save and `Escape` cancel shortcuts.
- **Card Completion**: Textual checkbox toggle (`[ ]` / `[x]`) that strikes through and grays out finished tasks.
- **List Management**:
  - Add new columns on the fly with the `+ New List` header action.
  - Three-dots (`...`) menu on each column header with options to **Remove done tasks** or **Delete list**.
  - Inline card composer (`+ Add a card`) anchored at the bottom of each list.
- **Cross-Session Persistence**: Board cards and column layouts automatically persist to `localStorage` across page reloads.
- **Dedicated Performance Benchmark (`#/benchmark`)**:
  - A separate, isolated view that runs genuine Virtual DOM mount and diffing tests across 1,000, 3,000, and 5,000 cards.
  - Displays real-time `performance.now()` execution times and renders a live card preview, without touching active board tasks.
- **Strictly Zero Icons**: Built entirely with clean CSS typography, borders, and textual indicators—no SVG icons, icon fonts, or emoji icons.

---

## 4. Quickstart: How to Clone & Run

Because `dot-js` uses standard browser-native ES Modules, **no build step, bundler, or transpiler is required**.

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari).
- Node.js (v18+) or any static HTTP server.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd frontend-framework
```

### 2. Run the Example Application
Serve the repository root or the `example/` folder using any static web server:

**Using Node.js / npx:**
```bash
npx serve .
# Or run specifically from the example directory:
cd example
npm start
```

**Using Python:**
```bash
python -m http.server 3000
```

Open your browser and navigate to:
```
http://localhost:3000/example/
```

### 3. Run Framework Unit Tests
The framework comes with a zero-dependency Node test suite validating Virtual DOM creation, keyed reconciliation, event delegation, reactivity, routing, and HTTP communication:

```bash
cd framework
node test/run-tests.js
```

All 7 test suites will execute and report results:
```
PASS: h() creates normalized element vnodes
PASS: h() handles key and flattening
PASS: diffKeyedChildren reorders DOM elements correctly
PASS: parseEventProp parses on:click and modifiers
PASS: createStore manages state, actions, and subscribers
PASS: createRouter compiles routes and parses parameters
PASS: HttpClient processes GET and POST with mock handler

Results: 7 passed, 0 failed.
```

---

## 5. Detailed Framework Documentation

For complete framework documentation, including:
- Architecture blueprint and Inversion of Control details
- Full API reference (`h`, `createApp`, `createStore`, `createRouter`, `http`)
- Performance engineering design decisions
- Best practices and component guidelines
- Step-by-step Reviewer Guide for extending the example application

Please refer to the comprehensive [Framework Documentation (`framework/README.md`)](./framework/README.md).
