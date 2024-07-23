import { useCallback, useMemo, useState } from 'react';

type MapOrEntries<K, V> = Map<K, V> | [K, V][];

type ValueSetter<V> = V | ((prevValue?: V) => V);

interface MapMutators<K, V> {
  set: (key: K, value: ValueSetter<V>) => void;
  setAll: (mapOrEntries: MapOrEntries<K, V>) => void;
  remove: (key: K) => void;
  clear: () => void;
}

function useMap<V>(
  initialStateMap?: MapOrEntries<string, V>
): [ReadonlyMap<string, V>, MapMutators<string, V>];

function useMap<K, V>(
  initialStateMap?: MapOrEntries<K, V>
): [ReadonlyMap<K, V>, MapMutators<K, V>];

function useMap<K, V>(
  initialStateMap: MapOrEntries<K, V> = new Map()
): [ReadonlyMap<K, V>, MapMutators<K, V>] {
  const [map, setMap] = useState(new Map(initialStateMap));

  const set = useCallback((key: K, value: ValueSetter<V>) => {
    setMap((prevMap) => {
      const prevValue = prevMap.get(key);
      const nextValue = value instanceof Function ? value(prevValue) : value;

      if (prevValue === nextValue) {
        return prevMap;
      }

      const nextMap = new Map(prevMap);
      nextMap.set(key, nextValue);

      return nextMap;
    });
  }, []);

  const setAll = useCallback((mapOrEntries: MapOrEntries<K, V>) => {
    setMap((prevMap) => {
      if (prevMap === mapOrEntries) {
        return prevMap;
      }

      return new Map(mapOrEntries);
    });
  }, []);

  const remove = useCallback((key: K) => {
    setMap((prevMap) => {
      const nextMap = new Map(prevMap);
      const isDeleted = nextMap.delete(key);

      return isDeleted ? nextMap : prevMap;
    });
  }, []);

  const clear = useCallback(() => {
    const newMap = new Map();

    setMap(newMap);

    return newMap;
  }, []);

  const mutators = useMemo<MapMutators<K, V>>(
    () => ({ set, setAll, remove, clear }),
    [set, setAll, remove, clear]
  );

  return [map, mutators];
}

export default useMap;
