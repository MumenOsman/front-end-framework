/**
 * Kanban Showcase Application Entrypoint.
 * Bootstraps the dot-js application, manages SPA routes (/ and /benchmark),
 * initializes reactive store, and mounts to DOM.
 */

import { createApp, createRouter, h } from '../../framework/src/index.js';
import { boardStore } from './store/boardStore.js';
import { Header } from './components/Header.js';
import { BoardView } from './views/BoardView.js';
import { BenchmarkView } from './views/BenchmarkView.js';

// Configure SPA client routes
const router = createRouter({
  routes: [
    { path: '/', component: BoardView, title: 'dot-js Kanban Board' },
    { path: '/benchmark', component: BenchmarkView, title: 'dot-js Performance Benchmark' }
  ],
  mode: 'hash'
});

// Create Application Container with Inversion of Control
const app = createApp({
  root: '#app',
  store: boardStore,
  router,
  render({ state, route, dispatch, navigate }) {
    let activeView = null;

    if (route && route.path === '/benchmark') {
      activeView = BenchmarkView({ state, dispatch });
    } else {
      activeView = BoardView({ state, dispatch });
    }

    return h('div', { class: 'app-container' },
      Header({
        route,
        onNavigate: (path) => navigate(path),
        onAddList: () => {
          const listName = prompt('Enter name for the new list:');
          if (listName) dispatch('addColumn', listName);
        }
      }),
      activeView
    );
  }
});

// Boot the application
app.mount();
boardStore.dispatch('initBoard');
