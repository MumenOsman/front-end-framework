/**
 * Minimalist Kanban Board Main View (Obsidian Style).
 * Robust drop execution with fallback tracking for cross-browser drag consistency.
 */

import { h } from '../../../framework/src/index.js';
import { Column } from '../components/Column.js';

let activeDraggingId = null;
let activeDraggingColumn = null;

function getDropIndex(containerEl, clientY) {
  if (!containerEl) return 0;
  const cardsList = containerEl.classList.contains('cards-list')
    ? containerEl
    : (containerEl.querySelector('.cards-list') || containerEl);

  const cards = Array.from(cardsList.querySelectorAll('.task-card:not(.card-dragging)'));
  if (cards.length === 0) return 0;

  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (clientY < midY) {
      return i;
    }
  }
  return cards.length;
}

function getColumnDropIndex(containerEl, clientX) {
  if (!containerEl) return 0;
  const columnsList = containerEl.classList.contains('board-columns')
    ? containerEl
    : (containerEl.querySelector('.board-columns') || containerEl);

  const columns = Array.from(columnsList.querySelectorAll('.column:not(.column-is-dragging)'));
  if (columns.length === 0) return 0;

  for (let i = 0; i < columns.length; i++) {
    const rect = columns[i].getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (clientX < midX) {
      return i;
    }
  }
  return columns.length;
}

export function BoardView({ state, dispatch }) {
  const { tasks, columns, dragState, columnDragState, editingTaskId, composingColumn, openMenuColumn } = state;
  const curColDrag = columnDragState || { draggedColumn: null, targetIndex: null };
  const isColDraggingActive = Boolean(curColDrag.draggedColumn || activeDraggingColumn);
  const stationaryColumns = columns.filter(c => c !== (curColDrag.draggedColumn || activeDraggingColumn));

  function handleBoardColumnsDragOver(e) {
    if (isColDraggingActive) {
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const container = e.currentTarget;
      const clientX = e.clientX !== undefined ? e.clientX : (e.nativeEvent?.clientX || 0);
      const targetIdx = getColumnDropIndex(container, clientX);
      if (curColDrag.targetIndex !== targetIdx) {
        dispatch('setColumnDragState', {
          draggedColumn: curColDrag.draggedColumn || activeDraggingColumn,
          targetIndex: targetIdx
        });
      }
    }
  }

  function handleBoardColumnsDrop(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const finalCol = curColDrag.draggedColumn || activeDraggingColumn;
    if (finalCol) {
      const targetIdx = curColDrag.targetIndex !== null ? curColDrag.targetIndex : stationaryColumns.length;
      activeDraggingColumn = null;
      dispatch('moveColumnToIndex', {
        sourceColumn: finalCol,
        targetIndex: targetIdx
      });
    }
  }

  function handleColumnDragOverClientX(clientX) {
    const boardEl = document.querySelector('.board-columns');
    const targetIdx = getColumnDropIndex(boardEl, clientX);
    if (curColDrag.targetIndex !== targetIdx) {
      dispatch('setColumnDragState', {
        draggedColumn: curColDrag.draggedColumn || activeDraggingColumn,
        targetIndex: targetIdx
      });
    }
  }

  return h('div', { class: 'board-page' },
    h('main', {
      class: 'board-container',
      'on:click': () => {
        if (openMenuColumn) dispatch('setOpenMenuColumn', null);
      }
    },
      h('div', {
        class: 'board-columns',
        'on:dragenter:prevent': (e) => {
          if (isColDraggingActive && e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        },
        'on:dragover:prevent': handleBoardColumnsDragOver,
        'on:drop:prevent': handleBoardColumnsDrop
      },
        columns.map(columnTitle => {
          const columnTasks = tasks.filter(t => t.column === columnTitle);
          const isThisColDragged = (curColDrag.draggedColumn || activeDraggingColumn) === columnTitle;
          let isColumnDropBefore = false;
          let isColumnDropAfter = false;

          if (isColDraggingActive && !isThisColDragged) {
            const stationaryIndex = stationaryColumns.indexOf(columnTitle);
            if (stationaryIndex !== -1) {
              if (curColDrag.targetIndex === stationaryIndex) {
                isColumnDropBefore = true;
              } else if (curColDrag.targetIndex >= stationaryColumns.length && stationaryIndex === stationaryColumns.length - 1) {
                isColumnDropAfter = true;
              }
            }
          }

          return Column({
            title: columnTitle,
            tasks: columnTasks,
            dragState,
            editingTaskId,
            composingColumn,
            isMenuOpen: openMenuColumn === columnTitle,
            isColumnDragging: isThisColDragged,
            isColumnDropBefore,
            isColumnDropAfter,
            isColumnDragActive: isColDraggingActive,
            onColumnDragStart: (colTitle) => {
              activeDraggingColumn = colTitle;
              dispatch('setColumnDragState', {
                draggedColumn: colTitle,
                targetIndex: columns.indexOf(colTitle)
              });
            },
            onColumnDragEnd: () => {
              setTimeout(() => {
                activeDraggingColumn = null;
                dispatch('setColumnDragState', { draggedColumn: null, targetIndex: null });
              }, 60);
            },
            onColumnDragOver: (clientX) => {
              handleColumnDragOverClientX(clientX);
            },
            onDropColumn: () => {
              handleBoardColumnsDrop();
            },
            onToggleCompleted: (id) => dispatch('toggleTaskCompleted', id),
            onStartEdit: (id) => dispatch('setEditingTaskId', id),
            onSaveEdit: async (id, content) => {
              await dispatch('updateCardContent', { id, content });
              dispatch('setEditingTaskId', null);
            },
            onCancelEdit: () => dispatch('setEditingTaskId', null),
            onDelete: (id) => dispatch('deleteTask', id),
            onDragStart: (id) => {
              activeDraggingId = id;
              dispatch('setDragState', {
                draggedId: id,
                targetColumn: columnTitle,
                targetIndex: columnTasks.findIndex(t => t.id === id)
              });
            },
            onDragEnd: () => {
              activeDraggingId = null;
              dispatch('setDragState', { draggedId: null, targetColumn: null, targetIndex: null });
            },
            onDragOverLane: (colTitle, container, clientY) => {
              if (isColDraggingActive) return; // Do not mix card and column drag events
              const targetIdx = getDropIndex(container, clientY);
              if (dragState.targetColumn !== colTitle || dragState.targetIndex !== targetIdx) {
                dispatch('setDragState', {
                  draggedId: dragState.draggedId || activeDraggingId,
                  targetColumn: colTitle,
                  targetIndex: targetIdx
                });
              }
            },
            onDropTask: (taskId, colTitle) => {
              if (isColDraggingActive) return;
              const finalId = taskId || activeDraggingId || dragState.draggedId;
              activeDraggingId = null;
              if (!finalId) return;

              const targetIdx = dragState.targetColumn === colTitle && dragState.targetIndex !== null
                ? dragState.targetIndex
                : columnTasks.length;

              dispatch('moveTaskToIndex', {
                taskId: finalId,
                targetColumn: colTitle,
                targetIndex: targetIdx
              });
            },
            onStartCompose: (colTitle) => dispatch('setComposingColumn', colTitle),
            onCancelCompose: () => dispatch('setComposingColumn', null),
            onSaveNewCard: async (colTitle, content) => {
              await dispatch('addCard', { column: colTitle, content });
              dispatch('setComposingColumn', null);
            },
            onToggleMenu: (colTitle) => {
              dispatch('setOpenMenuColumn', openMenuColumn === colTitle ? null : colTitle);
            },
            onClearDone: (colTitle) => {
              dispatch('clearDoneTasksInColumn', colTitle);
            },
            onDeleteColumn: (colTitle) => {
              const colTasks = tasks.filter(t => t.column === colTitle);
              const confirmMsg = colTasks.length > 0
                ? `Delete list "${colTitle}" and all ${colTasks.length} cards inside it?`
                : `Delete list "${colTitle}"?`;
              if (window.confirm(confirmMsg)) {
                dispatch('deleteColumn', colTitle);
              }
            }
          });
        })
      )
    )
  );
}
