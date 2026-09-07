/**
 * Reactive State Management Store.
 * Provides central state container, subscriber notifications,
 * action dispatching, batched microtask updates, and session persistence.
 */

import { scheduleUpdate } from './scheduler.js';
import { StorageAdapter } from './storage.js';

export function createStore({
  initialState = {},
  actions = {},
  persistKey = null,
  storageType = 'local'
} = {}) {
  let storageAdapter = persistKey ? new StorageAdapter(persistKey, storageType) : null;
  let persistedState = storageAdapter ? storageAdapter.load() : null;

  let state = persistedState ? { ...initialState, ...persistedState } : { ...initialState };
  const subscribers = new Set();
  let pendingNotification = false;

  function getState() {
    return state;
  }

  function notifySubscribers() {
    if (pendingNotification) return;
    pendingNotification = true;

    scheduleUpdate(() => {
      pendingNotification = false;
      if (storageAdapter) {
        storageAdapter.save(state);
      }
      const snapshot = getState();
      for (const listener of subscribers) {
        try {
          listener(snapshot);
        } catch (err) {
          console.error('[dot-js store] Error in subscriber listener:', err);
        }
      }
    });
  }

  function setState(partialOrFn) {
    const nextSlice = typeof partialOrFn === 'function' ? partialOrFn(state) : partialOrFn;
    state = { ...state, ...nextSlice };
    notifySubscribers();
  }

  async function dispatch(actionName, payload) {
    if (typeof actions[actionName] === 'function') {
      const context = {
        state: getState(),
        getState,
        setState,
        dispatch
      };
      const result = await actions[actionName](context, payload);
      return result;
    } else {
      console.warn(`[dot-js store] Action "${actionName}" not found on store.`);
    }
  }

  function subscribe(listener) {
    subscribers.add(listener);
    return function unsubscribe() {
      subscribers.delete(listener);
    };
  }

  function reset(newState = initialState) {
    state = { ...newState };
    if (storageAdapter) {
      storageAdapter.clear();
    }
    notifySubscribers();
  }

  return {
    getState,
    setState,
    dispatch,
    subscribe,
    reset
  };
}
