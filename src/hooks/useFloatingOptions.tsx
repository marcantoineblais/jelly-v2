"use client";

import {
  autoUpdate,
  flip,
  offset,
  size as floatingSize,
  useFloating,
} from "@floating-ui/react";
import { useCallback, useMemo, useState } from "react";

import { Option } from "../components/ui/FloatingOptions";

type Props<T> = {
  options: Option<T>[];
  isSearchable?: boolean;
  onSearchChange?: (value: string) => void;
};

export default function useFloatingOptions<T>({
  options,
  isSearchable,
  onSearchChange,
}: Props<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFieldElement, setSearchFieldElement] =
    useState<HTMLInputElement | null>(null);
  const [optionsElement, setOptionsElement] = useState<HTMLUListElement | null>(
    null,
  );

  const {
    refs: { reference, setReference, setFloating },
    floatingStyles,
    placement,
  } = useFloating({
    open: isOpen,
    placement: "bottom-start",
    middleware: [
      offset(4),
      flip(),
      floatingSize({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });
  // When flipped above the button, the list's near edge is its last item.
  const opensUpward = useMemo(() => placement.startsWith("top"), [placement]);

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !search || onSearchChange) return options;
    const term = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [isSearchable, search, options, onSearchChange]);

  const focusOnOption = useCallback(
    (index: number = 0) => {
      if (!isOpen || filteredOptions.length === 0) return;

      if (!optionsElement) return;

      const normalizedIndex = Math.max(
        Math.min(index, filteredOptions.length - 1),
        0,
      );
      (optionsElement.children[normalizedIndex] as HTMLLIElement).focus();
    },
    [isOpen, filteredOptions, optionsElement],
  );

  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.code !== "ArrowDown") return;

      e.preventDefault();
      focusOnOption();
    },
    [focusOnOption],
  );

  const onSelectKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      // Only the arrow key pointing toward the panel should open/focus it.
      const opensTowardPanel = opensUpward
        ? e.code === "ArrowUp"
        : e.code === "ArrowDown";
      if (!opensTowardPanel) return;

      e.preventDefault();
      if (opensUpward) {
        focusOnOption(filteredOptions.length - 1);
        return;
      }

      const element = searchFieldElement;
      if (isSearchable && element) {
        element.focus();
      } else {
        focusOnOption();
      }
    },
    [
      opensUpward,
      searchFieldElement,
      isSearchable,
      focusOnOption,
      filteredOptions.length,
    ],
  );

  const floatingOptionsProps = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      search,
      setSearch,
      searchFieldElement,
      optionsElement,
      setFloating,
      setSearchFieldElement,
      setOptionsElement,
      floatingStyles,
      placement,
      opensUpward,
      onSearchKeyDown,
      focusOnOption,
      options: filteredOptions,
    }),
    [
      isOpen,
      setIsOpen,
      search,
      setSearch,
      searchFieldElement,
      optionsElement,
      setFloating,
      setSearchFieldElement,
      setOptionsElement,
      floatingStyles,
      placement,
      opensUpward,
      onSearchKeyDown,
      focusOnOption,
      filteredOptions,
    ],
  );

  return {
    isOpen,
    setIsOpen,
    search,
    setSearch,
    onSelectKeyDown,
    reference,
    setReference,
    floatingOptionsProps,
  };
}
