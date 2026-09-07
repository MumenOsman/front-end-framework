/**
 * Render and Update Scheduler.
 * Batches synchronous state mutations and UI updates into a single microtask,
 * preventing unnecessary DOM thrashing and layout recalculations.
 */

let updateQueue = new Set();
let isPending = false;

export function scheduleUpdate(callback) {
  updateQueue.add(callback);

  if (!isPending) {
    isPending = true;

    const flush = () => {
      isPending = false;
      const tasks = Array.from(updateQueue);
      updateQueue.clear();

      for (let i = 0; i < tasks.length; i++) {
        try {
          tasks[i]();
        } catch (err) {
          console.error('[dot-js scheduler] Error executing task:', err);
        }
      }
    };

    if (typeof queueMicrotask === 'function') {
      queueMicrotask(flush);
    } else if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(flush);
    } else {
      setTimeout(flush, 0);
    }
  }
}
