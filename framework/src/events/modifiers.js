/**
 * Event handling modifiers and utilities.
 * Declarative helpers for preventing default browser behavior and stopping bubbling.
 */

export function prevent(handler) {
  return function (event, ...args) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    if (typeof handler === 'function') {
      return handler(event, ...args);
    }
  };
}

export function stop(handler) {
  return function (event, ...args) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (typeof handler === 'function') {
      return handler(event, ...args);
    }
  };
}

export function preventAndStop(handler) {
  return prevent(stop(handler));
}
