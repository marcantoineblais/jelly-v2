"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { hasErrors } from "@/src/libs/files/getSelectionStats";
import CheckboxInput from "../ui/CheckboxInput";

type SelectableRowProps = {
  id: string;
  files: MediaFile | MediaFile[];
  label: ReactNode;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  /** Chips shown under the label. */
  children?: ReactNode;
  /** Controls on the right; clicks there don't toggle the selection. */
  trailing?: ReactNode;
  className?: string;
  labelClassName?: string;
};

/**
 * Row whose whole surface toggles the selection of one or more files.
 */
export default function SelectableRow({
  id,
  files,
  label,
  isSelected = false,
  isIndeterminate = false,
  onSelect,
  children,
  trailing,
  className,
  labelClassName,
}: SelectableRowProps) {
  const isInvalid = Array.isArray(files)
    ? files.some(hasErrors)
    : hasErrors(files);

  function toggle() {
    onSelect(!isSelected, files);
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
        "w-full min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer",
        "transition-colors duration-150 hover:bg-white/3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
        "data-selected:bg-primary/8 data-selected:hover:bg-primary/10",
        className,
      )}
    >
      <CheckboxInput
        id={`select-${id}`}
        checked={isSelected}
        isIndeterminate={isIndeterminate}
        color={isInvalid ? "danger" : "primary"}
        onChange={(value) => onSelect(value, files)}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="min-w-0 grow flex flex-col gap-1">
        <span
          data-error={isInvalid || undefined}
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
