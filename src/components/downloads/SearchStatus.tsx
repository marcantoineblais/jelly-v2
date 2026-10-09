"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SLOW_AFTER_S = 10;

/** Live "searching" indicator with elapsed time and a cancel shortcut. */
export default function SearchStatus({ onCancel }: { onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      250,
    );
    return () => clearInterval(id);
  }, []);

  const isSlow = elapsed >= SLOW_AFTER_S;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="shrink-0 flex items-center gap-3 rounded-xl border border-border bg-surface-card px-3.5 py-2.5 text-xs"
    >
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-primary animate-[blink_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
      <span className="grow min-w-0 truncate text-text-secondary">
        {isSlow ? "Some indexers are slow to respond…" : "Searching indexers…"}
        <span className="ml-1.5 tabular-nums text-text-muted">{elapsed}s</span>
      </span>
      <button
        type="button"
        onClick={onCancel}
        data-slow={isSlow || undefined}
        className="shrink-0 font-semibold text-text-muted hover:text-text cursor-pointer transition-colors data-slow:text-warning"
      >
        Cancel
      </button>
    </motion.div>
  );
}
