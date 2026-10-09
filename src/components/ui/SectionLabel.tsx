import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/** Small uppercase label used above values and lists. */
export default function SectionLabel({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "dt" | "p" | "span";
}) {
  return (
    <Tag
      className={twMerge(
        "text-[11px] uppercase tracking-wider text-text-muted",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
