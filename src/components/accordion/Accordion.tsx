"use client";

import { ReactNode } from "react";

type AccordionProps = {
  isOpen: boolean;
  children: ReactNode;
};

export default function Accordion({ isOpen, children }: AccordionProps) {
  return (
    <div
      className="duration-500 transition-[grid-template-rows] ease-in-out grid grid-rows-[0fr] data-open:grid-rows-[1fr]"
      data-open={isOpen || undefined}
    >
      <div className="p-px overflow-hidden">{children}</div>
    </div>
  );
}
