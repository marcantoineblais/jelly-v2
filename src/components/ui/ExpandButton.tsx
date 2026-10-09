"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { twJoin } from "tailwind-merge";
import IconButton from "./IconButton";

/** Chevron button that rotates when its section is expanded. */
export default function ExpandButton({
  isOpen,
  onToggle,
  label,
}: {
  isOpen: boolean;
  onToggle: () => void;
  /** Accessible label, e.g. "details" → "Show details" / "Hide details". */
  label: string;
}) {
  return (
    <IconButton
      icon={faChevronDown}
      ariaLabel={`${isOpen ? "Hide" : "Show"} ${label}`}
      aria-expanded={isOpen}
      size="sm"
      onClick={onToggle}
      className={twJoin(
        "size-8 rounded-lg flex items-center justify-center hover:bg-surface-hover",
        "transition-transform duration-300",
        isOpen && "rotate-180",
      )}
    />
  );
}
