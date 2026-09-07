/**
 * DOM Mounting Engine.
 * Converts Virtual DOM representations into live DOM elements,
 * binds declarative attributes, styles, dataset, and event delegates.
 */

import { parseEventProp, setElementHandlers } from '../events/delegator.js';

export function mount(vnode, container = null) {
  if (!vnode) return null;

  // Handle component functions
  if (typeof vnode.tag === 'function') {
    const componentInstance = vnode.tag(vnode.props, vnode.children);
    vnode._renderedVNode = componentInstance;
    const dom = mount(componentInstance, container);
    vnode.el = dom;
    return dom;
  }

  // Handle text nodes
  if (vnode.tag === '#text') {
    const textNode = document.createTextNode(vnode.text);
    vnode.el = textNode;
    if (container) {
      container.appendChild(textNode);
    }
    return textNode;
  }

  // Handle standard HTML elements
  const el = document.createElement(vnode.tag);
  vnode.el = el;

  const handlers = {};

  // Bind properties, attributes, and styles
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      if (value === null || value === undefined) continue;

      const eventInfo = parseEventProp(key, value);
      if (eventInfo) {
        handlers[eventInfo.eventName] = eventInfo.handler;
        continue;
      }

      setProp(el, key, value);
    }
  }

  // Register all handlers with the central event delegator
  setElementHandlers(el, handlers);

  // Mount children recursively
  if (Array.isArray(vnode.children)) {
    for (let i = 0; i < vnode.children.length; i++) {
      mount(vnode.children[i], el);
    }
  }

  if (container) {
    container.appendChild(el);
  }

  return el;
}

export function setProp(el, key, value) {
  if (key === 'class' || key === 'className') {
    el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : (value || '');
    return;
  }

  if (key === 'style') {
    if (typeof value === 'object' && value !== null) {
      for (const [styleName, styleVal] of Object.entries(value)) {
        if (styleName.startsWith('--')) {
          el.style.setProperty(styleName, styleVal);
        } else {
          el.style[styleName] = styleVal ?? '';
        }
      }
    } else if (typeof value === 'string') {
      el.style.cssText = value;
    }
    return;
  }

  if (key === 'dataset' && typeof value === 'object' && value !== null) {
    for (const [dataKey, dataVal] of Object.entries(value)) {
      el.dataset[dataKey] = dataVal;
    }
    return;
  }

  if (key === 'draggable') {
    const isDrag = value === true || value === 'true';
    el.draggable = isDrag;
    el.setAttribute('draggable', isDrag ? 'true' : 'false');
    return;
  }

  // Direct DOM properties (value, checked, selected, disabled, id, innerHTML)
  if (key in el && key !== 'list' && key !== 'form' && key !== 'type') {
    try {
      el[key] = value ?? '';
      return;
    } catch (_) {}
  }

  if (value === false) {
    el.removeAttribute(key);
  } else {
    el.setAttribute(key, value === true ? '' : String(value));
  }
}
