"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { ReactNode, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import CheckboxInput from "../ui/CheckboxInput";

/**
 * Selectable row header: the whole row toggles selection, the checkbox
 * reflects the (possibly indeterminate) state of the given files.
 */
export default function MediaCheckbox({
  id,
  children,
  files = [],
  label = "",
  isSelected = false,
  isIndeterminate = false,
  onSelect = () => {},
  trailing,
  className,
  labelClassName,
}: {
  id: string;
  children?: ReactNode;
  files?: MediaFile | MediaFile[];
  label?: ReactNode;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  onSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  trailing?: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  const hasError = useMemo(() => {
    if (Array.isArray(files)) {
      return files.some((file) => file.errors && file.errors.length > 0);
    }
    return files.errors !== undefined && files.errors.length > 0;
  }, [files]);

  function toggle() {
    onSelect(isIndeterminate && !isSelected ? true : !isSelected, files);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      data-selected={isSelected || undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className={twMerge(
        "group/row w-full min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
        "transition-colors duration-150 hover:bg-white/3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
        "data-selected:bg-primary/8 data-selected:hover:bg-primary/10",
        className,
      )}
    >
      <CheckboxInput
        id={`select-${id}`}
        checked={isSelected}
        isIndeterminate={isIndeterminate && !isSelected}
        color={hasError ? "danger" : "primary"}
        onChange={(value) => onSelect(value, files)}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="min-w-0 grow flex flex-col gap-1">
        <span
          data-error={hasError || undefined}
          className={twMerge(
            "block w-full truncate text-sm font-medium text-text data-error:text-danger-light",
            labelClassName,
          )}
        >
          {label}
        </span>
        {children && (
          <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        )}
      </div>

      {trailing && (
        <div
          className="shrink-0 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {trailing}
        </div>
      )}
    </div>
  );
}
