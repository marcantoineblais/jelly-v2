"use client";

import { ReactNode, useState } from "react";

type AccordionProps = {
  isOpen: boolean;
  children: ReactNode;
};

export default function Accordion({ isOpen, children }: AccordionProps) {
  const [isRendering, setIsRendering] = useState(isOpen);

  const handleTransitionEnd = () => {
    setIsRendering(isOpen);
  };

  return (
    <div
      className="overflow-hidden transition-[max-height] duration-500 ease-in-out max-h-0 h-full data-open:max-h-full"
      data-open={isOpen || undefined}
      onTransitionEnd={handleTransitionEnd}
    >
      {isRendering || isOpen ? children : null}
    </div>
  );
}
