"use client";

import {
  Dispatch,
  SetStateAction,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_PREFIX = "jelly:";

// Survives client-side navigation instantly; localStorage covers reloads.
const memoryCache = new Map<string, unknown>();

function readStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === undefined) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
    } else {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch {
    // Storage full or unavailable: the memory cache still works
  }
}

/**
 * useState that is kept in this browser between page visits and reloads.
 * For per-user preferences that should follow the account, use the session
 * (`useSession`) instead. Returns [value, setValue, reset].
 */
export default function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() =>
    memoryCache.has(key) ? (memoryCache.get(key) as T) : initialValue,
  );
  const valueRef = useRef(value);

  // After a full page load, restore from localStorage. Done in an effect so
  // the server and client render the same initial markup.
  useEffect(() => {
    if (memoryCache.has(key)) return;
    const stored = readStorage<T>(key);
    if (stored === undefined) return;
    memoryCache.set(key, stored);
    valueRef.current = stored;
    startTransition(() => setValue(stored));
  }, [key]);

  const setPersistentValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const next =
        typeof action === "function"
          ? (action as (prev: T) => T)(valueRef.current)
          : action;
      valueRef.current = next;
      memoryCache.set(key, next);
      writeStorage(key, next);
      setValue(next);
    },
    [key],
  );

  const reset = useCallback(() => {
    memoryCache.delete(key);
    writeStorage(key, undefined);
    valueRef.current = initialValueRef.current;
    setValue(initialValueRef.current);
  }, [key]);

  return [value, setPersistentValue, reset];
}
