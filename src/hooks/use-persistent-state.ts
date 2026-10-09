"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

const STORAGE_PREFIX = "jelly:";

// In-memory cache so state survives client-side navigation instantly,
// localStorage keeps it across reloads.
const memoryCache = new Map<string, unknown>();

function readStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable: memory cache still works
  }
}

/**
 * useState that remembers its value between page visits.
 * Returns [value, setValue, clear].
 */
export default function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(() =>
    memoryCache.has(key) ? (memoryCache.get(key) as T) : initialValue,
  );

  // Restore from localStorage after a full page load (not during SSR,
  // to avoid hydration mismatches).
  useEffect(() => {
    if (memoryCache.has(key)) return;
    const stored = readStorage<T>(key);
    if (stored !== undefined) {
      memoryCache.set(key, stored);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(stored);
    }
  }, [key]);

  const setPersistentValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      setValue((prev) => {
        const next =
          typeof action === "function"
            ? (action as (prev: T) => T)(prev)
            : action;
        memoryCache.set(key, next);
        writeStorage(key, next);
        return next;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    memoryCache.delete(key);
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } catch {
      // ignore
    }
    setValue(initialValue);
    // initialValue intentionally excluded: callers pass literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setPersistentValue, clear];
}
