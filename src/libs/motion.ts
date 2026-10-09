/**
 * Shared framer-motion presets.
 *
 * Convention: anything that enters, leaves or changes layout animates with
 * framer-motion using these presets. CSS transitions are only used for
 * hover/focus/state colour changes and infinite indicators (spinner, shimmer).
 */
import type { Transition } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const fadeTransition: Transition = { duration: 0.3, ease: EASE_OUT };

/** For small swaps (labels, icons) that should feel instant. */
export const quickTransition: Transition = { duration: 0.15, ease: EASE_OUT };

export const springTransition: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 38,
};

/** Fade + slide up on mount. Spread onto a motion element. */
export const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: fadeTransition,
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
} as const;

/** Small, capped delay for staggering list items. */
export function staggerDelay(index: number, step = 0.025, max = 15) {
  return Math.min(index, max) * step;
}
