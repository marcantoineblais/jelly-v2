"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { twMerge } from "tailwind-merge";

export type AccordionContext = {
  isOpen: (id: string) => boolean;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
  onToggle: (id: string) => void;
  closeAll: () => void;
  contentOnly: boolean;
};

const AccordionCtx = createContext<AccordionContext | null>(null);
export const ParentItemOpenContext = createContext(true);

export function useAccordionContext() {
  const ctx = useContext(AccordionCtx);
  if (!ctx) throw new Error("AccordionItem must be used inside an Accordion");
  return ctx;
}

type AccordionProps = {
  selectedItems: Set<string>;
  setSelectedItems: (keys: Set<string>) => void;
  multiple?: boolean;
  children: React.ReactNode | React.ReactNode[];
  className?: string;
  closeChildrenWhenParentCloses?: boolean;
  contentOnlyOnSingleChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Accordion({
  selectedItems,
  setSelectedItems,
  multiple = false,
  children,
  className,
  closeChildrenWhenParentCloses = true,
  contentOnlyOnSingleChild = false,
  ...props
}: AccordionProps) {
  const parentItemOpen = useContext(ParentItemOpenContext);

  const isOpen = useCallback(
    (id: string) => selectedItems.has(id),
    [selectedItems],
  );

  const onToggle = useCallback(
    (id: string) => {
      const next = new Set([...selectedItems]);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      setSelectedItems(next);
    },
    [multiple, setSelectedItems, selectedItems],
  );

  const onOpen = useCallback(
    (id: string) => {
      const next = new Set(multiple ? [...selectedItems] : []);
      next.add(id);
      setSelectedItems(next);
    },
    [multiple, setSelectedItems, selectedItems],
  );

  const onClose = useCallback(
    (id: string) => {
      const next = new Set([...selectedItems]);
      next.delete(id);

      setSelectedItems(next);
    },
    [setSelectedItems, selectedItems],
  );

  const closeAll = useCallback(() => {
    setSelectedItems(new Set());
  }, [setSelectedItems]);

  const contentOnly = useMemo(() => {
    if (!contentOnlyOnSingleChild) return false;
    return !Array.isArray(children) || children.length <= 1;
  }, [children, contentOnlyOnSingleChild]);

  useEffect(() => {
    if (!parentItemOpen && closeChildrenWhenParentCloses) {
      startTransition(() => {
        closeAll();
      });
    }
  }, [parentItemOpen, closeAll, closeChildrenWhenParentCloses]);

  return (
    <AccordionCtx.Provider
      value={{
        isOpen,
        onOpen,
        onClose,
        onToggle,
        closeAll,
        contentOnly,
      }}
    >
      <div
        className={twMerge(
          "bg-surface-card rounded px-2 py-4 space-y-2",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionCtx.Provider>
  );
}
