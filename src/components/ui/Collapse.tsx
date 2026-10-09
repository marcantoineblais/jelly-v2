"use client";

import { ReactNode, useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

/** Animated height collapse that unmounts content once closed. */
export default function Collapse({
  isOpen,
  children,
  className,
  duration = 250,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
}) {
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRendered(true);
      return;
    }
    const timeout = setTimeout(() => setIsRendered(false), duration);
    return () => clearTimeout(timeout);
  }, [isOpen, duration]);

  return (
    <div
      data-open={isOpen || undefined}
      className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] ease-[cubic-bezier(0.22,1,0.36,1)] data-open:grid-rows-[1fr] data-open:opacity-100"
      style={{ transitionDuration: `${duration}ms` }}
    >
      <div className={twMerge("min-h-0 overflow-hidden", className)}>
        {isRendered && children}
      </div>
    </div>
  );
}
