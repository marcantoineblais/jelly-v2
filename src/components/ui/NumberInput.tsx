"use client";

import { ReactNode } from "react";
import { twJoin } from "tailwind-merge";

import Label from "./Label";

type NumberInputProps = {
  id: string;
  label?: ReactNode;
  isRequired?: boolean;
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  validate?: (value: number | null) => void;
  autoComplete?: string;
  isDisabled?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  allowFloat?: boolean;
  className?: string;
};

export default function NumberInput({
  id,
  label = "",
  isRequired = false,
  value,
  onChange,
  error,
  validate = () => {},
  autoComplete,
  isDisabled,
  placeholder,
  min,
  max,
  allowFloat = false,
  className,
}: NumberInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let updatedValue: number | null = e.currentTarget.valueAsNumber;
    if (isNaN(updatedValue)) updatedValue = null;

    if (updatedValue != null) {
      if (!allowFloat) updatedValue = Math.floor(updatedValue);
      if (min != null && updatedValue < min) updatedValue = min;
      else if (max != null && updatedValue > max) updatedValue = max;
    }

    if (error) validate(updatedValue);
    onChange(updatedValue);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const target = e.currentTarget;
    if (value == null) {
      target.value = "";
    }
  }

  return (
    <div className={className}>
      <Label htmlFor={id} isRequired={isRequired}>
        {label}
      </Label>
      <input
        id={id}
        type="number"
        value={value == null ? "" : value.toString()}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete={autoComplete}
        disabled={isDisabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        data-invalid={error ? true : undefined}
        className={twJoin(
          "mt-1 block w-full rounded border px-3 h-9 text-sm bg-surface-card",
          "focus:outline-none focus:ring-1 disabled:opacity-50",
          "border-border focus:border-primary focus:ring-primary/50",
          "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger-ring",
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
