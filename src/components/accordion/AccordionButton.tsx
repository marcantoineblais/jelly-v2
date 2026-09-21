"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import IconButton from "../ui/IconButton";

type AccordionButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function AccordionButton({
  isOpen,
  onToggle,
}: AccordionButtonProps) {
  return (
    <IconButton
      onClick={onToggle}
      data-open={isOpen || undefined}
      className="h-full data-open:rotate-180"
      icon={faChevronDown}
      ariaLabel={isOpen ? "Close accordion" : "Open accordion"}
    />
  );
}
