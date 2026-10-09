import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/** Icon + value pair shown under a table item title. */
export default function TableStat({
  icon,
  children,
  className,
}: {
  icon: IconDefinition;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={twMerge("inline-flex items-center gap-1.5", className)}>
      <FontAwesomeIcon icon={icon} className="text-[10px]" />
      {children}
    </span>
  );
}

/** Row container for TableStat items. */
export function TableStats({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted tabular-nums">
      {children}
    </div>
  );
}
