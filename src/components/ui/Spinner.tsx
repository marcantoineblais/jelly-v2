"use client";

import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

export default function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass = useMemo(() => {
    switch (size) {
      case "sm":
        return "spinner-sm";
      case "lg":
        return "spinner-lg";
      default:
        return "spinner-md";
    }
  }, [size]);

  return (
    <div
      className={twMerge("spinner", sizeClass, className)}
      role="status"
      aria-label="Loading"
    >
      <span className="spinner-ring" aria-hidden="true" />
    </div>
  );
}
