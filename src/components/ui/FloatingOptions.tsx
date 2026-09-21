"use client";

import { ReactNode, useCallback, useEffect, useMemo } from "react";
import { twJoin } from "tailwind-merge";

export type Option<T> = {
  value: T;
  label: string;
  detail?: string;
  style?: React.CSSProperties;
};

type Props<T> = {
  id: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  value?: Set<T | undefined>;
  options: Option<T>[];
  onSelect: (option: T) => void;
  minSearchLength?: number;
  search: string;
  setSearch: (search: string) => void;
  noResultPlaceholder?: ReactNode;
  isSearchable?: boolean;
  autoFocusSearch?: boolean;
  disabledOptions?: Set<T>;
  isMultiple?: boolean;
  setFloating?: (node: HTMLElement | null) => void;
  floatingStyles?: React.CSSProperties;
  searchFooter?: React.ReactNode;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  opensUpward?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  focusOnOption: (index?: number) => void;
  searchFieldElement?: HTMLInputElement | null;
  setSearchFieldElement?: (node: HTMLInputElement | null) => void;
  setOptionsElement?: (node: HTMLUListElement | null) => void;
};

export default function FloatingOptions<T>({
  id,
  isOpen,
  setIsOpen,
  options,
  onSelect,
  value,
  minSearchLength = 3,
  search,
  setSearch,
  noResultPlaceholder,
  isSearchable,
  autoFocusSearch,
  disabledOptions = new Set(),
  isMultiple = false,
  searchFooter,
  searchFieldElement,
  setSearchFieldElement,
  setOptionsElement,
  floatingStyles,
  onSelectAll,
  onDeselectAll,
  searchPlaceholder,
  onSearchChange,
  setFloating,
  onSearchKeyDown,
  focusOnOption,
}: Props<T>) {
  const emptyPlaceholder = useMemo(() => {
    if (!noResultPlaceholder) return "No results";
    if (minSearchLength <= search.length) return "No results";
    return noResultPlaceholder;
  }, [noResultPlaceholder, search, minSearchLength]);

  const onSelectKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLLIElement>, value: T, index: number) => {
      e.stopPropagation();

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(value);
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusOnOption(index + 1);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        focusOnOption(index - 1);
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    },
    [focusOnOption, onSelect, setIsOpen],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      setIsOpen(false);
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen || !isSearchable || !autoFocusSearch) return;
    searchFieldElement?.focus({ preventScroll: true });
  }, [autoFocusSearch, isSearchable, isOpen, searchFieldElement]);

  if (!isOpen) return null;

  return (
    <div
      ref={setFloating}
      style={floatingStyles}
      className="z-50 rounded border border-border bg-surface-card shadow-lg"
    >
      {/* Search */}
      {isSearchable && (
        <div className="p-2 border-b border-border">
          <input
            id={`${id}-search`}
            name={`${id}-search`}
            ref={setSearchFieldElement}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onSearchChange?.(e.target.value);
            }}
            autoComplete="off"
            onKeyDown={onSearchKeyDown}
            placeholder={searchPlaceholder || "Search"}
            className={twJoin(
              "block w-full rounded border px-2 py-1.5 text-sm bg-surface-card",
              "border-border focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary-ring",
            )}
          />
        </div>
      )}

      {/* Bulk actions (multiple only) */}
      {isMultiple && (
        <div className="flex gap-2 px-3 py-1.5 border-b border-border">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs text-primary hover:underline"
          >
            {"Select all"}
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs text-primary hover:underline"
          >
            {"Deselect all"}
          </button>
        </div>
      )}

      {/* Options list */}
      {options.length === 0 ? (
        <div className="px-3 py-2 text-sm text-text-muted">
          {emptyPlaceholder}
        </div>
      ) : (
        <ul
          ref={setOptionsElement}
          role="listbox"
          aria-multiselectable={isMultiple || undefined}
          className="max-h-60 overflow-y-auto p-1 custom-scroll space-y-1 overflow-x-hidden"
        >
          {options.map((opt, i) => {
            const isSelected = value?.has(opt.value);

            return (
              <li
                key={i}
                role="option"
                tabIndex={-1}
                onKeyDown={(e) => onSelectKeyDown(e, opt.value, i)}
                onMouseEnter={() => focusOnOption(i)}
                onPointerDown={(e) => e.preventDefault()}
                aria-selected={isSelected}
                onClick={() => onSelect(opt.value)}
                data-selected={isSelected ? true : undefined}
                data-disabled={
                  (!isSelected && disabledOptions.has(opt.value)) || undefined
                }
                style={opt.style}
                className={twJoin(
                  "min-w-0 px-3 py-1 h-max min-h-9 flex items-center text-sm cursor-pointer rounded-md",
                  "hover:bg-surface transition-colors duration-200",
                  "focus:bg-surface focus:ring-1 focus:ring-primary-ring focus:outline-none",
                  "data-disabled:cursor-default data-disabled:hover:bg-transparent data-disabled:text-text-muted",
                  "data-selected:bg-primary/5 data-selected:hover:bg-primary/5",
                )}
              >
                <div className="min-w-0 w-full flex items-center gap-2">
                  {isMultiple && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                      className="size-3 shrink-0 rounded border-border text-primary focus:ring-0 pointer-events-none"
                    />
                  )}
                  <div className="min-w-0 grow flex flex-col gap-1 overflow-hidden">
                    <span className="pt-0.5 w-full truncate leading-none">
                      {opt.label}
                    </span>

                    {opt.detail && (
                      <span className="w-full truncate text-xs text-text-muted">
                        {opt.detail}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {searchFooter && <div className="pt-4 pb-2 px-3">{searchFooter}</div>}
    </div>
  );
}
