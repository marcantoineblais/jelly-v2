"use client";

import { faCheck, faMinus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode, useMemo } from "react";
import { twJoin, twMerge } from "tailwind-merge";

import Label from "./Label";

type CheckboxColor =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "success"
  | "default";

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
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
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
  const colorClasses: Record<CheckboxColor, string> = useMemo(
    () => ({
      primary:
        "checked:bg-primary checked:border-primary focus:ring-primary-ring text-primary-foreground",
      secondary:
        "checked:bg-secondary checked:border-secondary focus:ring-secondary text-secondary-foreground",
      danger:
        "checked:bg-danger checked:border-danger focus:ring-danger-ring text-danger-foreground",
      warning:
        "checked:bg-warning checked:border-warning focus:ring-warning text-warning-foreground",
      success:
        "checked:bg-success checked:border-success focus:ring-success text-success-foreground",
      default:
        "checked:bg-surface checked:border-border focus:ring-border text-text",
    }),
    [],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const updatedChecked = isIndeterminate || e.target.checked;

    if (error) validate(updatedChecked);
    onChange(updatedChecked);
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="relative size-4.75">
          <input
            id={id}
            type="checkbox"
            checked={checked || isIndeterminate}
            onChange={handleChange}
            onClick={onClick}
            disabled={isDisabled || undefined}
            data-invalid={Boolean(error) || undefined}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={twMerge(
              "peer size-4.75 appearance-none rounded-md border bg-surface-card border-border",
              "transition-colors duration-200",
              "focus:outline-none focus:ring-1",
              colorClasses[color],
              "disabled:opacity-50",
              "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger-ring",
            )}
          />

          <FontAwesomeIcon
            icon={isIndeterminate ? faMinus : faCheck}
            aria-hidden="true"
            className={twJoin(
              "pointer-events-none absolute top-1 left-0.5 text-[9px] opacity-0 transition-opacity duration-200",
              "peer-checked:opacity-100",
              colorClasses[color],
            )}
          />
        </span>

        <Label
          htmlFor={id}
          isRequired={isRequired}
          className="leading-0 pt-1.5"
        >
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
