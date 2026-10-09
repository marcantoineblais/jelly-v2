"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/src/libs/format-relative-time";

/** Renders "5 min ago" and keeps it up to date. */
export default function RelativeTime({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <time dateTime={new Date(timestamp).toISOString()}>
      {formatRelativeTime(timestamp, Math.max(now, timestamp))}
    </time>
  );
}
