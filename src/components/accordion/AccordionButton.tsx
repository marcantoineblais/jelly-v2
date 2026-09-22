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
    <div className="shadow-btn border border-border rounded-md size-10 flex justify-center items-center">
      <IconButton
        onClick={onToggle}
        data-open={isOpen || undefined}
        className="h-full data-open:-rotate-180 duration-200 delay-300 transition-transform"
        icon={faChevronDown}
        ariaLabel={isOpen ? "Close accordion" : "Open accordion"}
      />
    </div>
  );
}
