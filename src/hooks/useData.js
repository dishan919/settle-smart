import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
export function useData(loader, deps = []) {
  const { revision } = useApp(),
    [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    generation = useRef(0);
  const refresh = useCallback(async () => {
    const ticket = ++generation.current;
    setLoading(true);
    try {
      const value = await loader();
      if (ticket === generation.current) {
        setData(value);
        setError(null);
      }
    } catch (e) {
      if (ticket === generation.current) setError(e.message);
    } finally {
      if (ticket === generation.current) setLoading(false);
    }
  }, deps);
  useEffect(() => {
    refresh();
    return () => {
      generation.current++;
    };
  }, [refresh, revision]);
  return { data, error, loading, refresh };
}
