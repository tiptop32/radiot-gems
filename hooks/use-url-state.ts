import { useMemo, useSyncExternalStore } from 'react';
import {
  type Filters,
  filtersFromSearch,
  filtersToSearch,
} from '@/lib/catalog';

// The address bar is the source of truth for filters and the linked find,
// so every view can be shared as a link.
const LOCATION_EVENT = 'radiot-gems:location';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener('hashchange', listener);
  window.addEventListener(LOCATION_EVENT, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener('hashchange', listener);
    window.removeEventListener(LOCATION_EVENT, listener);
  };
}

const serverSnapshot = () => '';

export function useUrlFilters() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    serverSnapshot,
  );
  const filters = useMemo(() => filtersFromSearch(search), [search]);

  const setFilters = (next: Filters) => {
    const { pathname, hash } = window.location;
    window.history.replaceState(
      window.history.state,
      '',
      `${pathname}${filtersToSearch(next)}${hash}`,
    );
    window.dispatchEvent(new Event(LOCATION_EVENT));
  };

  return [filters, setFilters] as const;
}

export function useLocationHash() {
  return decodeURIComponent(
    useSyncExternalStore(
      subscribe,
      () => window.location.hash.slice(1),
      serverSnapshot,
    ),
  );
}
