"use client";

import { ReactNode, useId } from "react";
import { motion } from "framer-motion";
import { springTransition } from "@/src/libs/motion";
import { twJoin, twMerge } from "tailwind-merge";

export type Segment<T extends string> = {
  value: T;
  label: ReactNode;
  badge?: ReactNode;
};

export default function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  className,
  size = "medium",
}: {
  value: T;
  onChange: (value: T) => void;
  segments: Segment<T>[];
  className?: string;
  size?: "small" | "medium";
}) {
  const layoutId = useId();

  return (
    <div
      role="tablist"
      className={twMerge(
        "inline-flex items-center gap-1 p-1 rounded-xl bg-surface-card border border-border",
        className,
      )}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={twJoin(
              "relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors duration-200",
              size === "small" ? "h-7 px-2.5 text-xs" : "h-8 px-3.5 text-sm",
              active
                ? "text-text"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-surface-hover ring-1 ring-border-strong shadow-btn"
                transition={springTransition}
              />
            )}
            <span className="relative">{segment.label}</span>
            {segment.badge != null && (
              <span
                className={twJoin(
                  "relative min-w-5 h-5 px-1.5 rounded-full text-[11px] leading-5 tabular-nums",
                  active
                    ? "bg-primary/15 text-primary-light"
                    : "bg-white/5 text-text-muted",
                )}
              >
                {segment.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
