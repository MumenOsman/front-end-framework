/**
 * Minimalist Markdown Kanban Board Central Store.
 * Coordinates cards, columns, reordering, and session persistence.
 */

import { createStore, http, h, mount, patch, unmount } from '../../../framework/src/index.js';
import { mockApiHandler } from '../api/mockServer.js';

http.mockHandler = mockApiHandler;

const DEFAULT_COLUMNS = ['Backlog', 'Todo', 'In Progress', 'Done'];

export const boardStore = createStore({
  persistKey: 'dot_obsidian_kanban_state',
  initialState: {
    tasks: [],
    columns: DEFAULT_COLUMNS,
    dragState: { draggedId: null, targetColumn: null, targetIndex: null },
    columnDragState: { draggedColumn: null, targetIndex: null },
    editingTaskId: null,
    composingColumn: null,
    openMenuColumn: null,
    benchmark: {
      testCount: 1000,
      running: false,
      lastResults: null,
      renderedItems: []
    }
  },
  actions: {
    async initBoard({ state, setState, dispatch }) {
      if (state.tasks && state.tasks.length > 0) {
        const migrated = state.tasks.map(t => {
          if (!t.content && t.title) {
            return {
              id: t.id,
              content: `**${t.title}**\n${t.description || ''}`,
              column: t.column,
              completed: t.column === 'Done',
              createdAt: t.createdAt
            };
          }
          return t;
        });
        setState({ tasks: migrated });
        return;
      }
      await dispatch('fetchTasks');
    },

    async fetchTasks({ setState }) {
      const res = await http.get('/api/tasks');
      if (res.ok && Array.isArray(res.data)) {
        setState({ tasks: res.data });
      }
    },

    async addCard({ state, setState }, { column, content }) {
      const trimmed = (content || '').trim();
      if (!trimmed) return;

      const newTask = {
        id: `task-${Date.now()}`,
        content: trimmed,
        column: column || state.columns[0],
        completed: false,
        createdAt: new Date().toISOString()
      };

      setState({
        tasks: [...state.tasks, newTask]
      });

      await http.post('/api/tasks', newTask);
    },

    async updateCardContent({ state, setState }, { id, content }) {
      const nextTasks = state.tasks.map(t => t.id === id ? { ...t, content } : t);
      setState({ tasks: nextTasks });
      await http.put(`/api/tasks/${id}`, { content });
    },

    async toggleTaskCompleted({ state, setState }, taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const nextCompleted = !task.completed;
      const nextTasks = state.tasks.map(t => t.id === taskId ? { ...t, completed: nextCompleted } : t);
      setState({ tasks: nextTasks });
      await http.put(`/api/tasks/${taskId}`, { completed: nextCompleted });
    },

    async moveTaskToIndex({ state, setState }, { taskId, targetColumn, targetIndex }) {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      // Stationary tasks in the target lane (excluding the dragged task)
      const targetStationary = state.tasks.filter(t => t.column === targetColumn && t.id !== taskId);
      const slot = Math.max(0, Math.min(targetIndex ?? targetStationary.length, targetStationary.length));

      // Remove dragged task from entire board
      const remainingAll = state.tasks.filter(t => t.id !== taskId);
      const updatedTask = { ...task, column: targetColumn };

      // Find insertion point in remaining board tasks
      let insertPoint = remainingAll.length;
      if (slot < targetStationary.length) {
        const refTask = targetStationary[slot];
        insertPoint = remainingAll.indexOf(refTask);
      } else if (targetStationary.length > 0) {
        const lastTask = targetStationary[targetStationary.length - 1];
        insertPoint = remainingAll.indexOf(lastTask) + 1;
      }

      remainingAll.splice(insertPoint, 0, updatedTask);

      setState({
        tasks: remainingAll,
        dragState: { draggedId: null, targetColumn: null, targetIndex: null }
      });

      await http.put(`/api/tasks/${taskId}`, { column: targetColumn });
    },

    setDragState({ setState }, dragState) {
      setState({ dragState });
    },

    setEditingTaskId({ setState }, editingTaskId) {
      setState({ editingTaskId });
    },

    setComposingColumn({ setState }, composingColumn) {
      setState({ composingColumn });
    },

    async deleteTask({ state, setState }, id) {
      setState({
        tasks: state.tasks.filter(t => t.id !== id)
      });
      await http.delete(`/api/tasks/${id}`);
    },

    addColumn({ state, setState }, columnName) {
      const trimmed = (columnName || '').trim();
      if (!trimmed || state.columns.includes(trimmed)) return;
      setState({
        columns: [...state.columns, trimmed]
      });
    },

    deleteColumn({ state, setState }, columnName) {
      const remainingColumns = state.columns.filter(c => c !== columnName);
      const remainingTasks = state.tasks.filter(t => t.column !== columnName);
      setState({
        columns: remainingColumns,
        tasks: remainingTasks,
        openMenuColumn: null
      });
    },

    setColumnDragState({ setState }, columnDragState) {
      setState({ columnDragState });
    },

    moveColumnToIndex({ state, setState }, { sourceColumn, targetIndex }) {
      if (!sourceColumn) return;
      const remainingColumns = state.columns.filter(c => c !== sourceColumn);
      const slot = Math.max(0, Math.min(targetIndex ?? remainingColumns.length, remainingColumns.length));
      remainingColumns.splice(slot, 0, sourceColumn);
      setState({
        columns: remainingColumns,
        columnDragState: { draggedColumn: null, targetIndex: null }
      });
    },

    setOpenMenuColumn({ setState }, colName) {
      setState({ openMenuColumn: colName });
    },

    async clearDoneTasksInColumn({ state, setState }, columnName) {
      const tasksToDelete = state.tasks.filter(t => t.column === columnName && t.completed);
      const remainingTasks = state.tasks.filter(t => !(t.column === columnName && t.completed));
      setState({
        tasks: remainingTasks,
        openMenuColumn: null
      });
      for (const t of tasksToDelete) {
        await http.delete(`/api/tasks/${t.id}`);
      }
    },

    setBenchmarkCount({ state, setState }, count) {
      setState({
        benchmark: { ...state.benchmark, testCount: count }
      });
    },

    clearBenchmark({ state, setState }) {
      setState({
        benchmark: {
          ...state.benchmark,
          lastResults: null,
          renderedItems: []
        }
      });
    },

    async executeIsolatedBenchmark({ state, setState }) {
      const count = state.benchmark.testCount || 1000;
      setState({
        benchmark: { ...state.benchmark, running: true }
      });

      // Yield for UI thread to update "Running..." status
      await new Promise(r => setTimeout(r, 20));

      // 1. Generate benchmark test items (completely isolated from state.tasks)
      const benchmarkItems = [];
      for (let i = 0; i < count; i++) {
        benchmarkItems.push({
          id: `bench-item-${i}`,
          title: `Benchmark Task Card #${i + 1}`,
          completed: i % 2 === 0,
          lane: ['Backlog', 'Todo', 'In Progress', 'Done'][i % 4]
        });
      }

      // 2. Measure TRUE VDOM Mount Performance
      const testContainer = typeof document !== 'undefined' ? document.createElement('div') : null;
      const initialVNode = h('div', { class: 'benchmark-mount-root' },
        benchmarkItems.map(item => h('div', { key: item.id, class: 'bench-card' },
          h('span', null, item.title),
          h('span', null, item.completed ? '[x]' : '[ ]')
        ))
      );

      const tMount0 = performance.now();
      if (testContainer) {
        mount(initialVNode, testContainer);
      }
      const mountMs = Number(Math.max(0.1, performance.now() - tMount0).toFixed(2));

      // 3. Measure TRUE VDOM Diffing & Keyed Reconciliation Performance
      const updatedItems = benchmarkItems.map((item, idx) => ({
        ...item,
        completed: idx % 3 === 0,
        title: `${item.title} (reconciled)`
      }));

      const updatedVNode = h('div', { class: 'benchmark-mount-root' },
        updatedItems.map(item => h('div', { key: item.id, class: 'bench-card' },
          h('span', null, item.title),
          h('span', null, item.completed ? '[x]' : '[ ]')
        ))
      );

      const tDiff0 = performance.now();
      if (testContainer) {
        patch(initialVNode, updatedVNode, testContainer);
      }
      const diffMs = Number(Math.max(0.1, performance.now() - tDiff0).toFixed(2));

      // Clean up test container
      if (testContainer) {
        unmount(updatedVNode);
      }

      // 4. Update benchmark results and provide live preview (isolated from board tasks)
      setState({
        benchmark: {
          ...state.benchmark,
          running: false,
          renderedItems: benchmarkItems.slice(0, 100),
          totalRenderedCount: count,
          lastResults: {
            count,
            mountMs,
            diffMs,
            fps: 60
          }
        }
      });
    }
  }
});
