"use client";

import { ReactNode } from "react";

type AccordionProps = {
  isOpen: boolean;
  children: ReactNode;
};

export default function Accordion({ isOpen, children }: AccordionProps) {
  return (
    <div
      className="duration-400 transition-[grid-template-rows,opacity] ease-[cubic-bezier(0.22,1,0.36,1)] grid grid-rows-[0fr] opacity-0 data-open:grid-rows-[1fr] data-open:opacity-100"
      data-open={isOpen || undefined}
    >
      <div className="p-px overflow-hidden">{children}</div>
    </div>
  );
}
