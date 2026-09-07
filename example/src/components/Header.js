/**
 * Minimalist Navigation Header Component (Obsidian Style).
 * Seamless switching between Board and Benchmark views (strictly zero icons).
 */

import { h } from '../../../framework/src/index.js';

export function Header({ route, onNavigate, onAddList }) {
  const currentPath = route ? route.path : '/';

  return h('header', { class: 'app-header' },
    h('div', { class: 'brand-section' },
      h('span', { class: 'brand-logo' }, 'dot-js kanban'),
      h('nav', { class: 'nav-links' },
        h('button', {
          class: `nav-button ${currentPath === '/' ? 'active' : ''}`,
          'on:click': () => onNavigate('/')
        }, 'Board'),
        h('button', {
          class: `nav-button ${currentPath === '/benchmark' ? 'active' : ''}`,
          'on:click': () => onNavigate('/benchmark')
        }, 'Benchmark')
      )
    ),

    h('div', { class: 'header-actions' },
      h('button', {
        class: 'btn btn-primary btn-sm',
        'on:click': onAddList
      }, '+ New List')
    )
  );
}
