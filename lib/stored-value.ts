// A value kept in localStorage and read through useSyncExternalStore, so the
// static HTML renders the fallback and the browser switches to the stored
// value right after hydration. Storage errors (private mode, blocked site
// data) fall back to "nothing stored".
const PREFIX = 'radiot-gems:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage is a convenience; losing a write is fine.
  }
}

export type StoredValue<T> = {
  get: () => T;
  getServer: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
};

/** `crossTab` also follows changes made in other tabs. */
export function storedValue<T>(
  key: string,
  fallback: T,
  { crossTab = false } = {},
): StoredValue<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();

  return {
    get: () => (cache ??= { value: read(key, fallback) }).value,
    getServer: () => fallback,
    set(value) {
      cache = { value };
      write(key, value === fallback ? null : value);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key !== PREFIX + key) return;
        cache = null;
        listener();
      };
      if (crossTab) window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}
