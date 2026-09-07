/**
 * Task Creation and Edit Modal Form.
 * Supports both creating new tasks and editing existing task details.
 */

import { h } from '../../../framework/src/index.js';

export function TaskModal({ isOpen, task, columns = [], onClose, onSave }) {
  if (!isOpen) return null;

  const isEditing = Boolean(task && task.id);
  const currentColumn = task?.column || columns[0] || 'Backlog';
  const currentPriority = task?.priority || 'Medium';
  const tagsStr = Array.isArray(task?.tags) ? task.tags.join(', ') : '';

  function handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    const form = event.target;
    const title = form.elements['title']?.value?.trim();
    const description = form.elements['description']?.value?.trim();
    const column = form.elements['column']?.value;
    const priority = form.elements['priority']?.value;
    const tagsRaw = form.elements['tags']?.value || '';

    if (!title) {
      alert('Task title is required.');
      return;
    }

    const tags = tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSave({
      ...(isEditing ? { id: task.id, createdAt: task.createdAt } : {}),
      title,
      description,
      column,
      priority,
      tags
    });
  }

  return h('div', {
    class: 'modal-overlay',
    'on:click': (e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }
  },
    h('div', { class: 'modal-dialog' },
      h('div', { class: 'modal-header' },
        h('h3', { class: 'modal-title' }, isEditing ? 'Edit Task' : 'New Task'),
        h('button', {
          class: 'btn btn-secondary btn-sm',
          'on:click': onClose
        }, 'Close')
      ),

      h('form', { 'on:submit:prevent': handleSubmit },
        h('div', { class: 'modal-body' },
          h('div', { class: 'form-group' },
            h('label', { class: 'form-label' }, 'Task Title *'),
            h('input', {
              type: 'text',
              name: 'title',
              class: 'input-text',
              value: task?.title || '',
              placeholder: 'Task title...',
              required: true,
              autofocus: true
            })
          ),

          h('div', { class: 'form-group' },
            h('label', { class: 'form-label' }, 'Description'),
            h('textarea', {
              name: 'description',
              class: 'textarea-input',
              rows: 3,
              value: task?.description || '',
              placeholder: 'Task description...'
            }, task?.description || '')
          ),

          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
            h('div', { class: 'form-group' },
              h('label', { class: 'form-label' }, 'Column / List'),
              h('select', { name: 'column', class: 'select-input' },
                columns.map(col => h('option', {
                  value: col,
                  selected: col === currentColumn
                }, col))
              )
            ),

            h('div', { class: 'form-group' },
              h('label', { class: 'form-label' }, 'Priority'),
              h('select', { name: 'priority', class: 'select-input' },
                h('option', { value: 'High', selected: currentPriority === 'High' }, 'High'),
                h('option', { value: 'Medium', selected: currentPriority === 'Medium' }, 'Medium'),
                h('option', { value: 'Low', selected: currentPriority === 'Low' }, 'Low')
              )
            )
          ),

          h('div', { class: 'form-group' },
            h('label', { class: 'form-label' }, 'Tags (comma separated)'),
            h('input', {
              type: 'text',
              name: 'tags',
              class: 'input-text',
              value: tagsStr,
              placeholder: 'Frontend, Bug, Refactor'
            })
          )
        ),

        h('div', { class: 'modal-footer' },
          h('button', {
            type: 'button',
            class: 'btn btn-secondary',
            'on:click': onClose
          }, 'Cancel'),
          h('button', {
            type: 'submit',
            class: 'btn btn-primary'
          }, isEditing ? 'Save Changes' : 'Create Task')
        )
      )
    )
  );
}
