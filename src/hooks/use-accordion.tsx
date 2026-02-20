"use client";

import { useCallback, useState } from "react";

export function useAccordion(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  return { isOpen, toggle };
}
