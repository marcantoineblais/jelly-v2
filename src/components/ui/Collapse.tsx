"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { fadeTransition } from "@/src/libs/motion";

/**
 * Animated height collapse; content is unmounted once closed.
 *
 * Don't put it directly in a flex/grid container with a `gap`: the gap stays
 * until the content unmounts, so the layout jumps at the end of the closing
 * animation. Put the spacing inside the collapsed content (e.g. `pt-3`).
 */
export default function Collapse({
  isOpen,
  children,
  className,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="collapse"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={fadeTransition}
          className={twMerge("overflow-hidden", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
