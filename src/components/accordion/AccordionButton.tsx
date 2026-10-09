"use client";

import { faChevronDown, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twJoin } from "tailwind-merge";

type AccordionButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
  label?: string;
  badge?: number;
};

export default function AccordionButton({
  isOpen,
  onToggle,
  label,
  badge,
}: AccordionButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Hide options" : "Show options"}
      data-open={isOpen || undefined}
      className={twJoin(
        "h-10 shrink-0 rounded-xl border border-border bg-surface-elevated shadow-btn",
        "inline-flex items-center justify-center gap-2 text-sm font-medium text-text-secondary cursor-pointer",
        "transition-[background-color,border-color,color,transform] duration-200 hover:bg-surface-hover hover:text-text active:scale-[0.97]",
        "data-open:border-primary/40 data-open:text-primary-light",
        label ? "px-3.5" : "w-10",
      )}
    >
      {label ? (
        <>
          <FontAwesomeIcon icon={faSliders} className="text-xs" />
          <span>{label}</span>
          {!!badge && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary-light text-[11px] leading-5 tabular-nums">
              {badge}
            </span>
          )}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={twJoin(
              "text-[10px] transition-transform duration-300",
              isOpen && "rotate-180",
            )}
          />
        </>
      ) : (
        <FontAwesomeIcon
          icon={faChevronDown}
          className={twJoin(
            "text-sm transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      )}
    </button>
  );
}
