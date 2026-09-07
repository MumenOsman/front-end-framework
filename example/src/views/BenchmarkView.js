/**
 * Dedicated Performance Benchmark View.
 * Provides high-volume stress testing and VDOM reconciliation metrics
 * in an isolated environment without overwriting the user's active board tasks.
 */

import { h } from '../../../framework/src/index.js';

export function BenchmarkView({ state, dispatch }) {
  const { benchmark } = state;
  const results = benchmark?.lastResults;

  return h('div', { class: 'benchmark-container' },
    h('div', { class: 'benchmark-header' },
      h('h2', { style: { fontSize: '1.25rem', fontWeight: '700' } }, 'Framework Performance Benchmark'),
      h('p', { style: { color: 'var(--text-secondary)', fontSize: '0.8125rem' } },
        'Executes isolated stress tests to validate Virtual DOM keyed diffing and microtask update batching speed. Active board cards remain safe and untouched.'
      )
    ),

    // Benchmark Controls
    h('div', { class: 'benchmark-controls-bar' },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
        h('span', { style: { fontSize: '0.8125rem', fontWeight: '600' } }, 'Test Volume:'),
        [1000, 3000, 5000].map(count =>
          h('button', {
            class: `btn ${benchmark.testCount === count ? 'btn-primary' : 'btn-secondary'} btn-sm`,
            'on:click': () => dispatch('setBenchmarkCount', count)
          }, `${count.toLocaleString()} Cards`)
        )
      ),

      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        results ? h('button', {
          class: 'btn btn-secondary',
          'on:click': () => dispatch('clearBenchmark')
        }, 'Clear Results') : null,
        h('button', {
          class: 'btn btn-primary',
          disabled: benchmark.running,
          'on:click': () => dispatch('executeIsolatedBenchmark')
        }, benchmark.running ? 'Running...' : `Run ${benchmark.testCount || 1000} Cards Test`)
      )
    ),

    // Telemetry Metrics Grid
    results ? h('div', { class: 'benchmark-grid' },
      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'Cards Rendered'),
        h('div', { class: 'stat-value' }, String(results.count))
      ),
      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'True Mount Duration'),
        h('div', { class: 'stat-value' }, `${results.mountMs} ms`)
      ),
      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'True Diff & Patch Duration'),
        h('div', { class: 'stat-value' }, `${results.diffMs} ms`)
      ),
      h('div', { class: 'stat-card' },
        h('span', { class: 'stat-label' }, 'Frame Rate (Target)'),
        h('div', { class: 'stat-value' }, `${results.fps} FPS`)
      )
    ) : h('div', { class: 'benchmark-idle-note' },
      'Select a volume and click "Run Test" to measure live VDOM performance.'
    ),

    // Live Rendered Cards Preview (Isolated from Board)
    benchmark.renderedItems && benchmark.renderedItems.length > 0 ? h('div', { class: 'benchmark-preview-section' },
      h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } },
        h('span', { style: { fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' } },
          `Rendered Cards Preview (Showing first 100 of ${benchmark.totalRenderedCount || 1000} cards)`
        ),
        h('span', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } },
          'Completely isolated: 0 benchmark cards exist on the main board'
        )
      ),
      h('div', { class: 'benchmark-preview-list' },
        benchmark.renderedItems.map(item =>
          h('div', { key: item.id, class: 'benchmark-preview-card' },
            h('span', { class: `preview-card-check ${item.completed ? 'checked' : ''}` }),
            h('span', { class: 'preview-card-title' }, item.title),
            h('span', { class: 'preview-card-badge' }, item.lane)
          )
        )
      )
    ) : null
  );
}
