/**
 * Task Detail View (/task/:id).
 * Demonstrates route parameter reading, URL-driven rendering, and cross-page state sharing.
 */

import { h } from '../../../framework/src/index.js';

export function TaskDetailView({ state, route, dispatch, navigate }) {
  const taskId = route?.params?.id;
  const task = state.tasks.find(t => t.id === taskId);

  if (!task) {
    return h('div', { class: 'detail-container' },
      h('div', { class: 'detail-card' },
        h('h2', null, 'Task Not Found'),
        h('p', { style: { color: 'var(--text-secondary)' } }, `No task matching ID "${taskId}" exists.`),
        h('button', {
          class: 'btn btn-secondary',
          'on:click': () => navigate('/')
        }, '<- Return to Board')
      )
    );
  }

  const priorityClass = `priority-badge ${task.priority.toLowerCase()}`;

  return h('div', { class: 'detail-container' },
    h('div', { class: 'detail-card' },
      h('div', { class: 'detail-header' },
        h('div', null,
          h('span', { class: priorityClass }, `Priority: ${task.priority}`),
          h('h2', { style: { marginTop: '8px', fontSize: '1.5rem' } }, task.title)
        ),
        h('span', { class: 'column-badge' }, `Column: ${task.column}`)
      ),

      h('div', { class: 'form-group' },
        h('span', { class: 'form-label' }, 'Description'),
        h('p', { style: { color: 'var(--text-primary)', lineHeight: '1.6' } },
          task.description || 'No additional description provided.'
        )
      ),

      task.tags && task.tags.length > 0 ? h('div', { class: 'form-group' },
        h('span', { class: 'form-label' }, 'Tags'),
        h('div', { class: 'card-tags' },
          task.tags.map(t => h('span', { class: 'card-tag' }, t))
        )
      ) : null,

      h('div', { class: 'form-group' },
        h('span', { class: 'form-label' }, 'Task Metadata'),
        h('p', { style: { color: 'var(--text-muted)', fontSize: '0.8125rem' } },
          `ID: ${task.id} | Created: ${new Date(task.createdAt).toLocaleString()}`
        )
      ),

      h('div', { class: 'card-footer', style: { marginTop: '16px' } },
        h('div', { class: 'card-controls' },
          h('button', {
            class: 'btn btn-secondary',
            'on:click': () => navigate('/')
          }, '<- Back to Board'),

          task.column !== 'Backlog' ? h('button', {
            class: 'btn btn-secondary',
            'on:click': () => dispatch('moveTask', { id: task.id, direction: 'prev' })
          }, '<- Move to Previous Column') : null,

          task.column !== 'Done' ? h('button', {
            class: 'btn btn-primary',
            'on:click': () => dispatch('moveTask', { id: task.id, direction: 'next' })
          }, 'Move to Next Column ->') : null
        ),

        h('button', {
          class: 'btn btn-danger',
          'on:click': async () => {
            await dispatch('deleteTask', task.id);
            navigate('/');
          }
        }, 'Delete Task')
      )
    )
  );
}
