"use client";

import type { ChangeEvent, MouseEvent, ReactNode } from "react";
import { twJoin, twMerge } from "tailwind-merge";

import Label from "./Label";

type CheckboxColor =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "success"
  | "default";

type CheckboxState = "unchecked" | "checked" | "indeterminate";

type CheckboxInputProps = {
  id: string;
  label?: ReactNode;
  isRequired?: boolean;
  checked?: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  validate?: (checked: boolean) => void;
  className?: string;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  color?: CheckboxColor;
  onClick?: (e: MouseEvent<HTMLInputElement>) => void;
};

const checkboxColorClasses: Record<CheckboxColor, string> = {
  primary:
    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary focus:ring-primary/50",
  secondary:
    "data-[state=checked]:border-secondary data-[state=checked]:bg-secondary data-[state=indeterminate]:border-secondary data-[state=indeterminate]:bg-secondary focus:ring-secondary/50",
  danger:
    "data-[state=checked]:border-danger data-[state=checked]:bg-danger data-[state=indeterminate]:border-danger data-[state=indeterminate]:bg-danger focus:ring-danger/50",
  warning:
    "data-[state=checked]:border-warning data-[state=checked]:bg-warning data-[state=indeterminate]:border-warning data-[state=indeterminate]:bg-warning focus:ring-warning/50",
  success:
    "data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=indeterminate]:border-success data-[state=indeterminate]:bg-success focus:ring-success/50",
  default:
    "data-[state=checked]:border-border data-[state=checked]:bg-surface data-[state=indeterminate]:border-border data-[state=indeterminate]:bg-surface focus:ring-border/50",
};

const indicatorColorClasses: Record<CheckboxColor, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  danger: "text-danger-foreground",
  warning: "text-warning-foreground",
  success: "text-success-foreground",
  default: "text-text",
};

export default function CheckboxInput({
  id,
  label = "",
  isRequired = false,
  checked = false,
  onChange,
  error,
  validate = () => {},
  className,
  isIndeterminate = false,
  isDisabled = false,
  color = "primary",
  onClick,
}: CheckboxInputProps) {
  const state: CheckboxState = isIndeterminate
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const updatedChecked = isIndeterminate || e.target.checked;

    if (error) validate(updatedChecked);
    onChange(updatedChecked);
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span
          data-state={state}
          data-disabled={isDisabled ? "true" : undefined}
          className="group grid size-4.75 shrink-0 place-items-center data-[disabled=true]:opacity-50"
        >
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            onClick={onClick}
            disabled={isDisabled || undefined}
            data-state={state}
            data-invalid={error ? "true" : undefined}
            aria-checked={isIndeterminate ? "mixed" : checked}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={twMerge(
              "col-start-1 row-start-1 m-0 block size-full appearance-none rounded-md border border-border bg-surface-card p-0",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-1",
              "disabled:cursor-not-allowed",
              checkboxColorClasses[color],
              "data-[invalid=true]:border-danger-light data-[invalid=true]:focus:border-danger data-[invalid=true]:focus:ring-danger-ring",
            )}
          />

          <svg
            aria-hidden="true"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={twJoin(
              "pointer-events-none col-start-1 row-start-1 size-3.25",
              indicatorColorClasses[color],
            )}
          >
            <path
              pathLength={1}
              d="M2.1 5.1 4.2 7.2 7.9 2.8"
              className={twJoin(
                "[stroke-dasharray:1] [stroke-dashoffset:1]",
                "transition-[stroke-dashoffset] duration-200 ease-out",
                "group-data-[state=checked]:[stroke-dashoffset:0]",
              )}
            />
          </svg>

          <svg
            aria-hidden="true"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className={twJoin(
              "pointer-events-none col-start-1 row-start-1 size-3.25",
              indicatorColorClasses[color],
            )}
          >
            <path
              pathLength={1}
              d="M2.4 5H7.6"
              className={twJoin(
                "[stroke-dasharray:1] [stroke-dashoffset:1]",
                "transition-[stroke-dashoffset] duration-200 ease-out",
                "group-data-[state=indeterminate]:[stroke-dashoffset:0]",
              )}
            />
          </svg>
        </span>

        <Label htmlFor={id} isRequired={isRequired} className="mt-0.5 leading-0">
          {label}
        </Label>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
