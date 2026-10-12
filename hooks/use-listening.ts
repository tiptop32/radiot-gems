import { useMemo, useSyncExternalStore } from 'react';
import { type StoredValue, storedValue } from '@/lib/stored-value';

export type Resume = { findId: string; seconds: number };

const EMPTY: string[] = [];
const listenedStore = storedValue<string[]>('listened', EMPTY, {
  crossTab: true,
});
// Not shared across tabs: each tab plays its own find.
const resumeStore = storedValue<Resume | null>('resume', null);
const rateStore = storedValue<number>('rate', 1);

const useStored = <T>(store: StoredValue<T>) =>
  useSyncExternalStore(store.subscribe, store.get, store.getServer);

// Per-browser listening history: finds marked as heard, the find and position
// to resume, and the playback speed.
export function useListening() {
  const listenedIds = useStored(listenedStore);
  const listened = useMemo(() => new Set(listenedIds), [listenedIds]);

  const markListened = (id: string) => {
    if (!listened.has(id)) listenedStore.set([...listenedIds, id]);
  };

  const toggleListened = (id: string) =>
    listenedStore.set(
      listened.has(id)
        ? listenedIds.filter((item) => item !== id)
        : [...listenedIds, id],
    );

  return {
    listened,
    markListened,
    toggleListened,
    resume: useStored(resumeStore),
    setResume: resumeStore.set,
    rate: useStored(rateStore),
    setRate: rateStore.set,
  };
}
