/**
 * Virtual DOM Diffing and Patching Engine.
 * Employs keyed reconciliation for list performance and surgical updates.
 */

import { mount, setProp } from './mount.js';
import { parseEventProp, setElementHandlers, clearElementHandlers } from '../events/delegator.js';

export function patch(oldVNode, newVNode, container = null) {
  if (!oldVNode && !newVNode) return null;

  // Case 1: Node removal
  if (oldVNode && !newVNode) {
    unmount(oldVNode);
    return null;
  }

  // Case 2: Node creation
  if (!oldVNode && newVNode) {
    const el = mount(newVNode, container);
    return el;
  }

  // Case 3: Component function reconciliation
  if (typeof oldVNode.tag === 'function' || typeof newVNode.tag === 'function') {
    if (oldVNode.tag !== newVNode.tag) {
      // Different components: replace entirely
      const el = mount(newVNode);
      if (oldVNode.el && oldVNode.el.parentNode) {
        oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
      }
      unmount(oldVNode);
      return el;
    }
    // Same component: re-render with new props
    const nextRender = newVNode.tag(newVNode.props, newVNode.children);
    newVNode._renderedVNode = nextRender;
    const el = patch(oldVNode._renderedVNode, nextRender, container);
    newVNode.el = el;
    return el;
  }

  // Case 4: Text node reconciliation
  if (oldVNode.tag === '#text' && newVNode.tag === '#text') {
    const el = oldVNode.el;
    newVNode.el = el;
    if (oldVNode.text !== newVNode.text) {
      el.nodeValue = newVNode.text;
    }
    return el;
  }

  // Case 5: Different HTML tag or replacement
  if (oldVNode.tag !== newVNode.tag) {
    const el = mount(newVNode);
    if (oldVNode.el && oldVNode.el.parentNode) {
      oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
    }
    unmount(oldVNode);
    return el;
  }

  // Case 6: Same HTML element tag: update props and diff children
  const el = oldVNode.el;
  newVNode.el = el;

  diffProps(el, oldVNode.props || {}, newVNode.props || {});
  diffChildren(el, oldVNode.children || [], newVNode.children || []);

  return el;
}

export function diffProps(el, oldProps, newProps) {
  const handlers = {};

  // Remove old props that no longer exist
  for (const key of Object.keys(oldProps)) {
    if (key.startsWith('on:') || key.startsWith('on')) {
      continue; // Handlers are recalculated below
    }
    if (!(key in newProps)) {
      if (key === 'class' || key === 'className') {
        el.className = '';
      } else if (key === 'style') {
        el.style.cssText = '';
      } else {
        el.removeAttribute(key);
      }
    }
  }

  // Set or update new props
  for (const [key, value] of Object.entries(newProps)) {
    const eventInfo = parseEventProp(key, value);
    if (eventInfo) {
      handlers[eventInfo.eventName] = eventInfo.handler;
      continue;
    }

    if (oldProps[key] !== value) {
      setProp(el, key, value);
    }
  }

  // Update handlers registered on delegator
  setElementHandlers(el, handlers);
}

export function diffChildren(parentEl, oldChildren, newChildren) {
  const hasKeys = newChildren.some(c => c && c.key != null) || oldChildren.some(c => c && c.key != null);

  if (hasKeys) {
    diffKeyedChildren(parentEl, oldChildren, newChildren);
  } else {
    diffUnkeyedChildren(parentEl, oldChildren, newChildren);
  }
}

function diffUnkeyedChildren(parentEl, oldChildren, newChildren) {
  const commonLength = Math.min(oldChildren.length, newChildren.length);

  for (let i = 0; i < commonLength; i++) {
    patch(oldChildren[i], newChildren[i], parentEl);
  }

  if (newChildren.length > oldChildren.length) {
    for (let i = commonLength; i < newChildren.length; i++) {
      mount(newChildren[i], parentEl);
    }
  } else if (oldChildren.length > newChildren.length) {
    for (let i = commonLength; i < oldChildren.length; i++) {
      unmount(oldChildren[i]);
    }
  }
}

function diffKeyedChildren(parentEl, oldChildren, newChildren) {
  const oldKeyMap = new Map();
  for (let i = 0; i < oldChildren.length; i++) {
    const child = oldChildren[i];
    const key = child && child.key != null ? child.key : i;
    oldKeyMap.set(key, { child, index: i });
  }

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];
    const key = newChild && newChild.key != null ? newChild.key : i;
    const oldEntry = oldKeyMap.get(key);

    if (oldEntry) {
      const { child: oldChild } = oldEntry;
      patch(oldChild, newChild, parentEl);
      oldKeyMap.delete(key);

      const currentDomNode = parentEl.childNodes[i];
      if (currentDomNode !== newChild.el) {
        parentEl.insertBefore(newChild.el, currentDomNode || null);
      }
    } else {
      // Brand new child node
      const currentDomNode = parentEl.childNodes[i];
      const newEl = mount(newChild);
      parentEl.insertBefore(newEl, currentDomNode || null);
    }
  }

  // Remove any remaining old children
  for (const [, { child }] of oldKeyMap) {
    unmount(child);
  }
}

export function unmount(vnode) {
  if (!vnode) return;

  if (vnode._renderedVNode) {
    unmount(vnode._renderedVNode);
  }

  if (Array.isArray(vnode.children)) {
    for (let i = 0; i < vnode.children.length; i++) {
      unmount(vnode.children[i]);
    }
  }

  if (vnode.el) {
    clearElementHandlers(vnode.el);
    if (vnode.el.parentNode) {
      vnode.el.parentNode.removeChild(vnode.el);
    }
  }
}
