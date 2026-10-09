"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/src/libs/motion";

const SLOW_AFTER_S = 10;

/** Live "searching" indicator with elapsed time. */
export default function SearchStatus() {
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
      {...fadeInUp}
      role="status"
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
      <span
        data-slow={isSlow || undefined}
        className="grow min-w-0 truncate text-text-secondary data-slow:text-warning"
      >
        {isSlow ? "Indexers are slow to respond…" : "Searching indexers…"}
      </span>
      <span className="shrink-0 tabular-nums text-text-muted">{elapsed}s</span>
    </motion.div>
  );
}
