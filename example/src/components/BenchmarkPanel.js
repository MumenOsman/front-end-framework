/**
 * Performance Benchmark Telemetry Panel.
 * Displays real-time measurement results and allows immediate return to normal board mode.
 */

import { h } from '../../../framework/src/index.js';

export function BenchmarkPanel({ benchmark, onReset }) {
  if (!benchmark || !benchmark.active) return null;

  return h('div', { class: 'benchmark-panel' },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' } },
      h('strong', { style: { fontSize: '0.8125rem' } }, 'BENCHMARK RUNNING:'),
      h('span', { class: 'metric-tag' }, `Count: ${benchmark.count}`),
      h('span', { class: 'metric-tag' }, `Mount: ${benchmark.mountMs} ms`),
      h('span', { class: 'metric-tag' }, `Reconciliation: ${benchmark.diffMs} ms`),
      h('span', { class: 'metric-tag' }, `FPS: ${benchmark.fps}`)
    ),

    h('button', {
      class: 'btn btn-primary btn-sm',
      'on:click': onReset
    }, 'Exit Benchmark & Restore Board')
  );
}
