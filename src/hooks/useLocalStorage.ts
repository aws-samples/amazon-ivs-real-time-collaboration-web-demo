import {
  getLocalStorageState,
  isLocalStorageSupported,
  LocalStorage,
  removeLocalStorageValue,
  setLocalStorageValue
} from '@LocalStorage';
import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';

const immutableDataKeys = new Set<keyof LocalStorage>(['simulcast']);
let storage = getLocalStorageState();

function fetchFromLocalStorage<K extends keyof LocalStorage>(key: K) {
  storage = getLocalStorageState();

  return storage[key];
}

function useLocalStorage<
  K extends keyof LocalStorage,
  V extends LocalStorage[K]
>(key: K) {
  const immutable = immutableDataKeys.has(key);
  const { cache } = useSWRConfig();
  const { data, mutate } = useSWR<V>(key, {
    refreshInterval: 0,
    dedupingInterval: 0,
    focusThrottleInterval: 0,
    revalidateOnReconnect: false,
    revalidateOnMount: !immutable,
    revalidateOnFocus: !immutable,
    revalidateIfStale: !immutable,
    fallbackData: immutable ? cache.get(key)?.data : storage[key],
    fetcher: isLocalStorageSupported ? fetchFromLocalStorage : undefined
  });

  const store = useCallback(
    (value: V | ((current?: V) => V)) => {
      mutate(
        (current = cache.get(key)?.data) => {
          const next = value instanceof Function ? value(current) : value;
          setLocalStorageValue(key, next);

          return next;
        },
        { revalidate: !immutable }
      );
    },
    [key, mutate, cache, immutable]
  );

  const remove = useCallback(() => {
    removeLocalStorageValue(key);

    // @ts-expect-error: SWR does not trigger a re-render when updating
    // the cache with `undefined`. Therefore, we temporarily update the
    // cache with null to force SWR to trigger a re-render.
    mutate(undefined, { optimisticData: null, revalidate: !immutable });
  }, [key, mutate, immutable]);

  return [data, store, remove] as const;
}

export default useLocalStorage;
