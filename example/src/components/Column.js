/**
 * Minimalist Kanban Column Component (Obsidian Style).
 * 1-to-1 card rendering to preserve DOM stability and drag ghosts during HTML5 drag operations.
 */

import { h } from '../../../framework/src/index.js';
import { Card } from './Card.js';

export function Column({
  title,
  tasks,
  dragState,
  editingTaskId,
  composingColumn,
  isMenuOpen,
  onToggleCompleted,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOverLane,
  onDropTask,
  onStartCompose,
  onCancelCompose,
  onSaveNewCard,
  onToggleMenu,
  onClearDone,
  onDeleteColumn,
  isColumnDragging,
  isColumnDropBefore,
  isColumnDropAfter,
  isColumnDragActive,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onDropColumn
}) {
  const isComposing = composingColumn === title;
  const isTargetColumn = dragState.targetColumn === title;
  const hasActiveDrag = Boolean(dragState.draggedId);

  // Stationary tasks in this lane (excluding the currently dragged card)
  const stationaryTasks = tasks.filter(t => t.id !== dragState.draggedId);

  // 1-to-1 card mapping ensures DOM nodes are never inserted or removed while dragging
  const cardElements = tasks.map((task) => {
    const isThisCardDragged = dragState.draggedId === task.id;
    let isDropBefore = false;
    let isDropAfter = false;

    if (isTargetColumn && hasActiveDrag && !isThisCardDragged) {
      const stationaryIndex = stationaryTasks.indexOf(task);
      if (stationaryIndex !== -1) {
        if (dragState.targetIndex === stationaryIndex) {
          isDropBefore = true;
        } else if (dragState.targetIndex >= stationaryTasks.length && stationaryIndex === stationaryTasks.length - 1) {
          isDropAfter = true;
        }
      }
    }

    return Card({
      task,
      isEditing: editingTaskId === task.id,
      isDragging: isThisCardDragged,
      isDropBefore,
      isDropAfter,
      onToggleCompleted,
      onStartEdit,
      onSaveEdit,
      onCancelEdit,
      onDelete,
      onDragStart,
      onDragEnd
    });
  });

  function handleDragOver(e) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (isColumnDragActive) {
      const clientX = e.clientX !== undefined ? e.clientX : (e.nativeEvent?.clientX || 0);
      if (onColumnDragOver) onColumnDragOver(clientX);
      return;
    }
    const container = e.currentTarget;
    const clientY = e.clientY !== undefined ? e.clientY : (e.nativeEvent?.clientY || 0);
    onDragOverLane(title, container, clientY);
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    let rawData = '';
    try {
      if (e.dataTransfer) rawData = e.dataTransfer.getData('text/plain');
    } catch (_) {}

    if (isColumnDragActive || (rawData && (rawData.startsWith('col:') || rawData.startsWith('column:')))) {
      if (onDropColumn) onDropColumn();
      return;
    }

    const taskId = rawData || dragState.draggedId;
    if (taskId) {
      onDropTask(taskId, title);
    }
  }

  const colDragClass = isColumnDragging ? ' column-is-dragging' : '';
  const colDropBeforeClass = isColumnDropBefore ? ' drop-column-before' : '';
  const colDropAfterClass = isColumnDropAfter ? ' drop-column-after' : '';

  return h('div', {
    class: `column ${isTargetColumn ? 'column-drag-active' : ''}${colDragClass}${colDropBeforeClass}${colDropAfterClass}`,
    key: title,
    dataset: { column: title },
    'on:dragenter:prevent': (e) => {
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    },
    'on:dragover:prevent': handleDragOver,
    'on:drop:prevent': handleDrop
  },
    h('div', {
      class: 'column-header',
      draggable: 'true',
      'on:dragstart': (e) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', 'column:' + title);
          e.dataTransfer.effectAllowed = 'move';
        }
        if (onColumnDragStart) onColumnDragStart(title);
      },
      'on:dragend': () => {
        if (onColumnDragEnd) onColumnDragEnd();
      }
    },
      h('span', { class: 'column-title' }, title),
      h('div', { class: 'column-header-actions' },
        h('span', { class: 'column-count' }, `${tasks.length}`),
        h('div', { class: 'column-menu-wrapper' },
          h('button', {
            class: `btn-column-menu ${isMenuOpen ? 'active' : ''}`,
            title: 'List options',
            'on:click:stop': () => onToggleMenu(title)
          }, '...'),
          isMenuOpen ? h('div', { class: 'column-dropdown-menu' },
            h('button', {
              class: 'dropdown-item',
              'on:click:stop': () => onClearDone(title)
            }, 'Remove done tasks'),
            h('button', {
              class: 'dropdown-item dropdown-item-danger',
              'on:click:stop': () => onDeleteColumn(title)
            }, 'Delete list')
          ) : null
        )
      )
    ),

    h('div', {
      class: 'cards-list',
      'on:dragenter:prevent': (e) => {
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      },
      'on:dragover:prevent': handleDragOver,
      'on:drop:prevent': handleDrop
    },
      cardElements.length === 0 && !isComposing
        ? h('div', { class: 'empty-lane-placeholder' }, 'No cards')
        : cardElements
    ),

    h('div', { class: 'column-footer' },
      isComposing
        ? h('div', { class: 'inline-composer' },
            h('textarea', {
              class: 'composer-textarea',
              id: `composer-${title}`,
              rows: 3,
              placeholder: 'Type card content... (supports **bold**, `code`, #tags, - lists)',
              autofocus: true,
              'on:keydown': (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  onSaveNewCard(title, e.target.value);
                } else if (e.key === 'Escape') {
                  onCancelCompose();
                }
              }
            }),
            h('div', { class: 'composer-actions' },
              h('button', {
                class: 'btn btn-primary btn-sm',
                'on:click': () => {
                  const textarea = document.getElementById(`composer-${title}`);
                  if (textarea) onSaveNewCard(title, textarea.value);
                }
              }, 'Add card'),
              h('button', {
                class: 'btn btn-secondary btn-sm',
                'on:click': onCancelCompose
              }, 'Cancel')
            )
          )
        : h('button', {
            class: 'btn-add-card-minimal',
            'on:click': () => onStartCompose(title)
          }, '+ Add a card')
    )
  );
}
