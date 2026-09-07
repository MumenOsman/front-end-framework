/**
 * dot-js Frontend Framework
 * Core framework entrypoint.
 */

export { createApp, App } from './app.js';
export { h, createTextVNode, Fragment } from './vdom/h.js';
export { mount, setProp } from './vdom/mount.js';
export { patch, unmount } from './vdom/diff.js';
export { Component, defineComponent } from './vdom/component.js';
export { setupEventDelegation, setElementHandlers, clearElementHandlers, parseEventProp } from './events/delegator.js';
export { prevent, stop, preventAndStop } from './events/modifiers.js';
export { createStore } from './state/store.js';
export { scheduleUpdate } from './state/scheduler.js';
export { StorageAdapter } from './state/storage.js';
export { createRouter } from './router/router.js';
export { http, HttpClient, createHttpClient } from './http/client.js';
export { benchmark, PerformanceBenchmark } from './perf/benchmark.js';
