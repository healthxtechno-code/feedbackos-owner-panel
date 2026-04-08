import { useState, useEffect, useCallback } from 'react';

// Generic async hook for API calls
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fn(...args);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
      throw err;
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { ...state, refetch: execute };
}

// Debounce hook
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Modal state hook
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState(null);

  const open = useCallback((d = null) => { setData(d); setIsOpen(true); }, []);
  const close = useCallback(() => { setIsOpen(false); setData(null); }, []);

  return { isOpen, data, open, close };
}
