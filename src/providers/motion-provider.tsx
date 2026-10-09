"use client";

import { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Disables framer-motion animations when the OS asks for reduced motion. */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
