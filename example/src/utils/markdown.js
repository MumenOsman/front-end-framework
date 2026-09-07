/**
 * Lightweight Markdown-to-VDOM Parser.
 * Renders bold (**text**), inline code (`code`), tags (#tag), bullets (- item),
 * and checklists (- [ ] task, - [x] task) into Virtual DOM elements without external libraries.
 */

import { h } from '../../../framework/src/index.js';

export function renderMarkdown(text) {
  if (!text) return [];

  const lines = text.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(h('div', { class: 'md-blank-line' }));
      continue;
    }

    // Checkbox line: - [ ] or - [x]
    const checkMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[1].toLowerCase() === 'x';
      const checkText = checkMatch[2];
      elements.push(h('div', { class: 'md-checklist-item' },
        h('span', { class: `md-checkbox ${isChecked ? 'checked' : ''}` }),
        h('span', { class: isChecked ? 'md-task-done' : '' }, parseInlineFormatting(checkText))
      ));
      continue;
    }

    // Bullet point: - item or * item
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      elements.push(h('div', { class: 'md-bullet-item' },
        h('span', { class: 'md-bullet' }, '-'),
        h('span', null, parseInlineFormatting(bulletMatch[1]))
      ));
      continue;
    }

    // Header line: # Header, ## Header, or standalone **Title**
    if (line.startsWith('#')) {
      const level = Math.min(line.match(/^#+/)[0].length, 4);
      const headerText = line.replace(/^#+\s*/, '');
      elements.push(h(`h${level + 1}`, { class: 'md-header' }, parseInlineFormatting(headerText)));
      continue;
    }

    // Regular line / paragraph
    elements.push(h('div', { class: 'md-line' }, parseInlineFormatting(line)));
  }

  return elements;
}

function parseInlineFormatting(text) {
  if (!text) return '';

  // Regex pattern matching bold (**text**), code (`code`), and hashtags (#tag)
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|#[a-zA-Z0-9_\-]+)/g;
  const parts = text.split(pattern);

  return parts.filter(Boolean).map(part => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return h('strong', { class: 'md-bold' }, part.slice(2, -2));
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return h('code', { class: 'md-code' }, part.slice(1, -1));
    }
    if (part.startsWith('#') && part.length > 1) {
      return h('span', { class: 'md-hashtag' }, part);
    }
    return part;
  });
}
