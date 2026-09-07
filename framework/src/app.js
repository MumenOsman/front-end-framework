/**
 * Application Container & Inversion of Control Engine.
 * Manages the top-level application lifecycle, coordinates routing,
 * reactive state, batched reconciliation, and event delegation.
 */

import { mount } from './vdom/mount.js';
import { patch, unmount } from './vdom/diff.js';
import { setupEventDelegation } from './events/delegator.js';
import { scheduleUpdate } from './state/scheduler.js';

export class App {
  constructor({ root, render, store = null, router = null } = {}) {
    this.rootSelector = root;
    this.renderFn = render;
    this.store = store;
    this.router = router;

    this.rootEl = null;
    this.currentVNode = null;
    this.isMounted = false;
    this.teardownDelegation = null;
    this.unsubStore = null;
    this.unsubRouter = null;
  }

  mount() {
    if (this.isMounted) return;
    if (typeof document === 'undefined') {
      return;
    }
    if (typeof this.rootSelector === 'string') {
      this.rootEl = document.querySelector(this.rootSelector);
      if (!this.rootEl) {
        throw new Error(`[dot-js] Root container "${this.rootSelector}" not found in DOM.`);
      }
    } else if (this.rootSelector instanceof HTMLElement) {
      this.rootEl = this.rootSelector;
    } else {
      throw new Error('[dot-js] Invalid root container provided to createApp.');
    }

    // 1. Establish centralized event delegation on root element
    this.teardownDelegation = setupEventDelegation(this.rootEl);

    // 2. Initialize router if configured
    if (this.router && typeof this.router.init === 'function') {
      this.router.init();
      this.unsubRouter = this.router.subscribe(() => {
        this.scheduleRender();
      });
    }

    // 3. Subscribe to reactive state store if configured
    if (this.store && typeof this.store.subscribe === 'function') {
      this.unsubStore = this.store.subscribe(() => {
        this.scheduleRender();
      });
    }

    // 4. Initial render and mount
    this.renderInitialTree();
    this.isMounted = true;
  }

  renderInitialTree() {
    const state = this.store ? this.store.getState() : {};
    const route = this.router ? this.router.getCurrentRoute() : null;

    this.currentVNode = this.renderFn({
      state,
      route,
      dispatch: this.store ? this.store.dispatch : null,
      navigate: this.router ? this.router.navigate : null
    });

    this.rootEl.innerHTML = '';
    mount(this.currentVNode, this.rootEl);
  }

  scheduleRender() {
    if (!this.isMounted) return;
    scheduleUpdate(() => {
      this.performReconciliation();
    });
  }

  performReconciliation() {
    const state = this.store ? this.store.getState() : {};
    const route = this.router ? this.router.getCurrentRoute() : null;

    const nextVNode = this.renderFn({
      state,
      route,
      dispatch: this.store ? this.store.dispatch : null,
      navigate: this.router ? this.router.navigate : null
    });

    patch(this.currentVNode, nextVNode, this.rootEl);
    this.currentVNode = nextVNode;
  }

  unmount() {
    if (!this.isMounted) return;

    if (this.unsubStore) this.unsubStore();
    if (this.unsubRouter) this.unsubRouter();
    if (this.teardownDelegation) this.teardownDelegation();

    if (this.currentVNode) {
      unmount(this.currentVNode);
    }

    this.isMounted = false;
  }
}

export function createApp(options) {
  return new App(options);
}
