"use client";

import { Button } from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

type AccordionButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function AccordionButton({
  isOpen,
  onToggle,
}: AccordionButtonProps) {
  const [isDisabled, setIsDisabled] = useState(false);

  function handleTransitionEnd() {
    setIsDisabled(false);
  }
  function handlePress() {
    setIsDisabled(true);
    onToggle();
  }

  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={isOpen ? "Close accordion" : "Open accordion"}
      onPress={handlePress}
      data-open={isOpen || undefined}
      disabled={isDisabled}
      onTransitionEnd={handleTransitionEnd}
      className="h-full shadow-btn"
    >
      <span
        className="h-full w-full flex items-center justify-center transition-transform duration-500 data-open:rotate-180"
        data-open={isOpen || undefined}
      >
        <FontAwesomeIcon icon={faChevronDown} />
      </span>
    </Button>
  );
}
