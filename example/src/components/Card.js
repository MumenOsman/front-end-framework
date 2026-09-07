/**
 * Minimalist Markdown Task Card Component (Obsidian Style).
 * Clean drop indicators (drop-before and drop-after) without altering DOM node structure.
 */

import { h } from '../../../framework/src/index.js';
import { renderMarkdown } from '../utils/markdown.js';

export function Card({
  task,
  isEditing,
  isDragging,
  isDropBefore,
  isDropAfter,
  onToggleCompleted,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDragStart,
  onDragEnd
}) {
  const isDone = Boolean(task.completed);

  // In-place editor on double-click
  if (isEditing) {
    return h('div', { class: 'task-card editing', key: `edit-${task.id}` },
      h('textarea', {
        class: 'inline-card-editor',
        rows: 3,
        id: `editor-${task.id}`,
        autofocus: true,
        'on:keydown': (e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            onSaveEdit(task.id, e.target.value);
          } else if (e.key === 'Escape') {
            onCancelEdit();
          }
        }
      }, task.content),
      h('div', { class: 'inline-editor-actions' },
        h('button', {
          class: 'btn btn-primary btn-sm',
          'on:click': () => {
            const textarea = document.getElementById(`editor-${task.id}`);
            if (textarea) onSaveEdit(task.id, textarea.value);
          }
        }, 'Save'),
        h('button', {
          class: 'btn btn-secondary btn-sm',
          'on:click': onCancelEdit
        }, 'Cancel')
      )
    );
  }

  const dropBeforeClass = isDropBefore ? ' drop-before' : '';
  const dropAfterClass = isDropAfter ? ' drop-after' : '';
  const dragClass = isDragging ? ' card-dragging' : '';
  const doneClass = isDone ? ' card-completed' : '';

  return h('div', {
    class: `task-card${doneClass}${dragClass}${dropBeforeClass}${dropAfterClass}`,
    key: task.id,
    dataset: { taskId: task.id },
    draggable: 'true',
    'on:dragstart': (e) => {
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }
      onDragStart(task.id);
    },
    'on:dragend': () => onDragEnd(),
    'on:dblclick': () => onStartEdit(task.id)
  },
    h('div', { class: 'card-inner-layout' },
      h('button', {
        class: `btn-checkbox ${isDone ? 'checked' : ''}`,
        title: isDone ? 'Mark incomplete' : 'Mark complete',
        'on:click:stop': () => onToggleCompleted(task.id)
      }),

      h('div', { class: `card-markdown-body ${isDone ? 'scratch-done' : ''}` },
        renderMarkdown(task.content)
      )
    ),

    h('div', { class: 'card-hover-actions' },
      h('button', {
        class: 'btn-inline-delete',
        title: 'Delete card',
        'on:click:stop': () => onDelete(task.id)
      }, 'delete')
    )
  );
}
