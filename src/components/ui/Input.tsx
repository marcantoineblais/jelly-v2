"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import { twJoin, twMerge } from "tailwind-merge";

import IconButton from "./IconButton";
import Label from "./Label";

type InputProps = {
  id: string;
  label?: ReactNode;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  isRequired?: boolean;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  validate?: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
};

export default function Input({
  id,
  label = "",
  isRequired = false,
  value = "",
  onChange,
  error,
  validate = () => {},
  onBlur,
  onFocus,
  autoComplete,
  placeholder,
  className,
  maxLength,
  isDisabled = false,
  isClearable = false,
}: InputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const updatedValue = e.target.value;
    if (maxLength && updatedValue.length > maxLength) return;
    if (error) validate(updatedValue);
    onChange(updatedValue);
  }

  function handleClear() {
    if (error) validate("");
    onChange("");
  }

  return (
    <div className={twMerge("relative", className)}>
      <Label htmlFor={id} isRequired={isRequired && Boolean(label)}>
        {label}
      </Label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        autoComplete={autoComplete}
        disabled={isDisabled || undefined}
        data-clearable={isClearable || undefined}
        data-invalid={Boolean(error) || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={twJoin(
          "mt-1 block w-full min-w-48 rounded-md border px-3 h-9 text-sm bg-surface-card border-border",
          "disabled:opacity-50",
          "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50",
          "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger/50",
          "data-clearable:pr-9",
        )}
      />

      {isClearable && value && (
        <IconButton
          icon={faXmark}
          onClick={handleClear}
          className="absolute right-2 bottom-1.5 hover:bg-transparent transition-colors duration-200"
          ariaLabel="Clear"
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
