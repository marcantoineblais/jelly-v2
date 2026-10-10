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

export type PersistentStorage = "local" | "session";

// Survives client-side navigation instantly; web storage covers reloads.
const memoryCache = new Map<string, unknown>();

function getStorage(storage: PersistentStorage): Storage {
  return storage === "session" ? window.sessionStorage : window.localStorage;
}

function readStorage<T>(
  storage: PersistentStorage,
  key: string,
): T | undefined {
  try {
    const raw = getStorage(storage).getItem(STORAGE_PREFIX + key);
    return raw == null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function writeStorage(storage: PersistentStorage, key: string, value: unknown) {
  try {
    if (value === undefined) {
      getStorage(storage).removeItem(STORAGE_PREFIX + key);
    } else {
      getStorage(storage).setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    }
  } catch {
    // Storage full or unavailable: the memory cache still works
  }
}

/**
 * useState that is kept in this browser between page visits and reloads.
 * With `storage: "session"` it only lasts for the browser tab's session.
 * For per-user preferences that should follow the account, use the session
 * (`useSession`) instead. Returns [value, setValue, reset].
 */
export default function usePersistentState<T>(
  key: string,
  initialValue: T,
  { storage = "local" }: { storage?: PersistentStorage } = {},
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() =>
    memoryCache.has(key) ? (memoryCache.get(key) as T) : initialValue,
  );
  const valueRef = useRef(value);

  // After a full page load, restore from web storage. Done in an effect so
  // the server and client render the same initial markup.
  useEffect(() => {
    if (memoryCache.has(key)) return;
    const stored = readStorage<T>(storage, key);
    if (stored === undefined) return;
    memoryCache.set(key, stored);
    valueRef.current = stored;
    startTransition(() => setValue(stored));
  }, [storage, key]);

  const setPersistentValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const next =
        typeof action === "function"
          ? (action as (prev: T) => T)(valueRef.current)
          : action;
      valueRef.current = next;
      memoryCache.set(key, next);
      writeStorage(storage, key, next);
      setValue(next);
    },
    [storage, key],
  );

  const reset = useCallback(() => {
    memoryCache.delete(key);
    writeStorage(storage, key, undefined);
    valueRef.current = initialValueRef.current;
    setValue(initialValueRef.current);
  }, [storage, key]);

  return [value, setPersistentValue, reset];
}
