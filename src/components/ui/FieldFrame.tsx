"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import { twJoin, twMerge } from "tailwind-merge";
import IconButton from "./IconButton";
import Label from "./Label";

/** Shared look of every text-like input (text, number, password, autocomplete). */
export const fieldInputClassName = twJoin(
  "block w-full min-w-0 h-10 px-3 rounded-xl border border-border bg-surface/60 text-sm",
  "placeholder:text-text-muted hover:border-border-strong disabled:opacity-50",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "focus:border-primary/70 focus:outline-none focus:ring-4 focus:ring-primary/15",
  "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger/15",
  // Room for the trailing controls (clear button, password toggle, stepper)
  "data-trailing:pr-10",
);

type FieldFrameProps = {
  id: string;
  label?: ReactNode;
  isRequired?: boolean;
  error?: string;
  /** Controls shown inside the input on the right, vertically centered. */
  trailing?: ReactNode;
  trailingClassName?: string;
  className?: string;
  /** The input element (plus anything that should sit next to it). */
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;

/**
 * Label + input + trailing controls + error message. The trailing slot is
 * positioned relative to the input only, so it stays centered whether or not
 * there is a label or an error.
 */
export default function FieldFrame({
  id,
  label,
  isRequired = false,
  error,
  trailing,
  trailingClassName,
  className,
  children,
  ...props
}: FieldFrameProps) {
  return (
    <div className={className} {...props}>
      {label && (
        <Label htmlFor={id} isRequired={isRequired}>
          {label}
        </Label>
      )}
      <div className="relative">
        {children}
        {trailing && (
          <div
            className={twMerge(
              "absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1.5",
              trailingClassName,
            )}
          >
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FieldClearButton({
  onClick,
  isDisabled,
}: {
  onClick: () => void;
  isDisabled?: boolean;
}) {
  return (
    <IconButton
      icon={faXmark}
      ariaLabel="Clear"
      onClick={onClick}
      isDisabled={isDisabled}
      className="size-7 rounded-lg flex items-center justify-center hover:bg-surface-hover"
    />
  );
}
