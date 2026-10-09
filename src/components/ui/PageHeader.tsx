"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { fadeInUp } from "@/src/libs/motion";

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      {...fadeInUp}
      className={twMerge("flex items-end justify-between gap-4", className)}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-muted truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </motion.div>
  );
}
