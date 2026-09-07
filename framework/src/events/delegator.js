/**
 * Centralized Event Delegation Subsystem.
 * Attaches listeners to the root application container and delegates events down
 * to target elements using declarative event maps, rather than attaching raw
 * addEventListener calls to each individual DOM node.
 */

import { prevent, stop, preventAndStop } from './modifiers.js';

const DELEGATED_EVENTS = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'input',
  'change',
  'submit',
  'reset',
  'keydown',
  'keyup',
  'keypress',
  'focusin',
  'focusout',
  'dragstart',
  'dragenter',
  'dragover',
  'dragleave',
  'drop',
  'dragend'
];

// WeakMap holding element -> { [eventType]: handlerFunction }
const elementHandlers = new WeakMap();

/**
 * Parses an event prop key (e.g., 'on:click', 'on:submit:prevent', 'onclick')
 * into an event name and modifier wrappers.
 */
export function parseEventProp(key, handler) {
  if (typeof handler !== 'function') return null;

  let eventName = '';
  let isPrevent = false;
  let isStop = false;

  if (key.startsWith('on:')) {
    const parts = key.slice(3).split(':');
    eventName = parts[0].toLowerCase();
    for (let i = 1; i < parts.length; i++) {
      if (parts[i] === 'prevent') isPrevent = true;
      if (parts[i] === 'stop') isStop = true;
    }
  } else if (key.startsWith('on') && key.length > 2) {
    eventName = key.slice(2).toLowerCase();
  } else {
    return null;
  }

  let finalHandler = handler;
  if (isPrevent && isStop) {
    finalHandler = preventAndStop(finalHandler);
  } else if (isPrevent) {
    finalHandler = prevent(finalHandler);
  } else if (isStop) {
    finalHandler = stop(finalHandler);
  }

  return { eventName, handler: finalHandler };
}

/**
 * Registers handlers for a specific DOM element.
 */
export function setElementHandlers(domElement, handlers) {
  if (!domElement) return;
  if (!handlers || Object.keys(handlers).length === 0) {
    elementHandlers.delete(domElement);
  } else {
    elementHandlers.set(domElement, handlers);
  }
}

/**
 * Clears handlers for a specific DOM element upon unmount.
 */
export function clearElementHandlers(domElement) {
  if (domElement) {
    elementHandlers.delete(domElement);
  }
}

/**
 * Initializes centralized event delegation on the root container.
 */
export function setupEventDelegation(rootContainer) {
  if (!rootContainer || rootContainer.__dot_delegation_active) {
    return;
  }

  const listeners = [];

  function handleRootEvent(nativeEvent) {
    const eventType = nativeEvent.type;
    let target = nativeEvent.target;

    // Dispatch from target element bubbling up to the root container
    while (target && target !== rootContainer.parentNode) {
      const handlers = elementHandlers.get(target);
      if (handlers && typeof handlers[eventType] === 'function') {
        let isPropagationStopped = false;

        // Wrapped event providing safe lifecycle hooks
        const syntheticEvent = {
          nativeEvent,
          target,
          currentTarget: target,
          type: eventType,
          preventDefault: () => nativeEvent.preventDefault(),
          stopPropagation: () => {
            isPropagationStopped = true;
            nativeEvent.stopPropagation();
          },
          get defaultPrevented() {
            return nativeEvent.defaultPrevented;
          }
        };

        if (nativeEvent.dataTransfer) {
          syntheticEvent.dataTransfer = nativeEvent.dataTransfer;
        }
        if (nativeEvent.clientY !== undefined) {
          syntheticEvent.clientY = nativeEvent.clientY;
          syntheticEvent.clientX = nativeEvent.clientX;
        }

        // Forward native properties
        for (const prop in nativeEvent) {
          if (!(prop in syntheticEvent)) {
            try {
              const val = nativeEvent[prop];
              if (typeof val === 'function') {
                syntheticEvent[prop] = val.bind(nativeEvent);
              } else {
                syntheticEvent[prop] = val;
              }
            } catch (_) {}
          }
        }

        handlers[eventType](syntheticEvent);

        if (isPropagationStopped) {
          break;
        }
      }

      if (target === rootContainer) {
        break;
      }
      target = target.parentNode;
    }
  }

  for (const eventName of DELEGATED_EVENTS) {
    rootContainer.addEventListener(eventName, handleRootEvent);
    listeners.push({ eventName, handler: handleRootEvent });
  }

  rootContainer.__dot_delegation_active = true;

  return function teardownEventDelegation() {
    for (const { eventName, handler } of listeners) {
      rootContainer.removeEventListener(eventName, handler);
    }
    delete rootContainer.__dot_delegation_active;
  };
}
