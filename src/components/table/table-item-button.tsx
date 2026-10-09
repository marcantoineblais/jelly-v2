"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { twJoin } from "tailwind-merge";
import { fadeInUp, staggerDelay } from "@/src/libs/motion";

export type TableItemButtonProps = {
  children: ReactNode;
  index?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

/** Clickable card row used by the result and torrent lists. */
export default function TableItemButton({
  children,
  index = 0,
  onClick,
  ...props
}: TableItemButtonProps) {
  return (
    <motion.li
      initial={fadeInUp.initial}
      animate={fadeInUp.animate}
      transition={{ ...fadeInUp.transition, delay: staggerDelay(index) }}
    >
      <button
        type="button"
        {...props}
        onClick={onClick}
        className={twJoin(
          "group w-full text-start card rounded-2xl px-4 py-3.5 cursor-pointer",
          "transition-[border-color,background-color,transform] duration-200",
          "hover:border-border-strong hover:bg-surface-elevated active:scale-[0.99]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
        )}
      >
        {children}
      </button>
    </motion.li>
  );
}
