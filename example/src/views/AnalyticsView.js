/**
 * Analytics View (/analytics).
 * Demonstrates multi-page state sharing, computing aggregate board statistics from state.
 */

import { h } from '../../../framework/src/index.js';

export function AnalyticsView({ state, navigate }) {
  const { tasks, columns } = state;

  const total = tasks.length;
  const doneCount = tasks.filter(t => t.column === 'Done').length;
  const inProgressCount = tasks.filter(t => t.column === 'In Progress').length;
  const inReviewCount = tasks.filter(t => t.column === 'In Review').length;
  const backlogCount = tasks.filter(t => t.column === 'Backlog').length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High').length;

  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return h('div', { class: 'analytics-container' },
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
      h('h2', null, 'Board Analytics & Metrics'),
      h('button', {
        class: 'btn btn-secondary',
        'on:click': () => navigate('/')
      }, '<- Return to Board')
    ),

    h('div', { class: 'analytics-grid' },
      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'Total Tasks'),
        h('div', { class: 'stat-value' }, String(total))
      ),

      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'Completion Rate'),
        h('div', { class: 'stat-value', style: { color: '#34d399' } }, `${completionRate}%`)
      ),

      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'High Priority'),
        h('div', { class: 'stat-value', style: { color: '#f87171' } }, String(highPriorityCount))
      ),

      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'Active In Progress'),
        h('div', { class: 'stat-value', style: { color: '#38bdf8' } }, String(inProgressCount))
      )
    ),

    h('div', { class: 'detail-card' },
      h('h3', null, 'Column Breakdown'),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          h('span', null, 'Backlog:'),
          h('strong', null, `${backlogCount} tasks`)
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          h('span', null, 'In Progress:'),
          h('strong', null, `${inProgressCount} tasks`)
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          h('span', null, 'In Review:'),
          h('strong', null, `${inReviewCount} tasks`)
        ),
        h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
          h('span', null, 'Done:'),
          h('strong', null, `${doneCount} tasks`)
        )
      )
    )
  );
}
