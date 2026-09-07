/**
 * State Storage Adapter.
 * Manages cross-session state persistence using localStorage or sessionStorage.
 */

export class StorageAdapter {
  constructor(key, type = 'local') {
    this.key = key;
    this.type = type;
    this.storage = typeof window !== 'undefined'
      ? (type === 'session' ? window.sessionStorage : window.localStorage)
      : null;
  }

  load() {
    if (!this.storage || !this.key) return null;
    try {
      const serialized = this.storage.getItem(this.key);
      if (serialized === null || serialized === undefined) return null;
      return JSON.parse(serialized);
    } catch (err) {
      console.warn(`[dot-js storage] Failed to load key "${this.key}":`, err);
      return null;
    }
  }

  save(data) {
    if (!this.storage || !this.key) return;
    try {
      const serialized = JSON.stringify(data);
      this.storage.setItem(this.key, serialized);
    } catch (err) {
      console.warn(`[dot-js storage] Failed to save key "${this.key}":`, err);
    }
  }

  clear() {
    if (!this.storage || !this.key) return;
    try {
      this.storage.removeItem(this.key);
    } catch (err) {
      console.warn(`[dot-js storage] Failed to clear key "${this.key}":`, err);
    }
  }
}
