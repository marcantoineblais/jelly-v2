"use client";

import { useCallback, useEffect, useRef } from "react";

export default function useAutoTrigger() {
  const action = useRef<() => void | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const initialTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
      if (initialTimer.current) {
        clearTimeout(initialTimer.current);
        initialTimer.current = null;
      }
    };
  }, []);

  const startTrigger = useCallback(
    (
      func: () => void,
      { interval, initialWait = 0 }: { interval: number; initialWait?: number },
    ) => {
      if (timer.current) return;

      // Set and call the action once on start
      action.current = func;
      func();

      // After the timeout, start the interval to repeatedly call the action
      initialTimer.current = setTimeout(() => {
        timer.current = setInterval(() => {
          if (action.current) {
            action.current();
          } else {
            clearInterval(timer.current ?? 0);
            timer.current = null;
          }
        }, interval);
      }, initialWait);
    },
    [],
  );

  const stopTrigger = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    if (initialTimer.current) {
      clearTimeout(initialTimer.current);
      initialTimer.current = null;
    }
    action.current = null;
  }, []);

  return { startTrigger, stopTrigger };
}
