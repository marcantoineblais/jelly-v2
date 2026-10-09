"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { ReactNode, useState } from "react";
import { twJoin } from "tailwind-merge";

import IconButton from "./IconButton";
import Label from "./Label";

type PasswordInputProps = {
  id: string;
  label: ReactNode;
  isRequired?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  validate?: (value: string) => void;
  autoComplete?: string;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
};

export default function PasswordInput({
  id,
  label,
  isRequired = false,
  value,
  onChange,
  error,
  validate = () => {},
  autoComplete,
  isDisabled = false,
  placeholder,
  className,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  function handleToggle() {
    setVisible((prev) => !prev);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const updatedValue = e.target.value;
    if (error) validate(updatedValue);
    onChange(updatedValue);
  }

  return (
    <div className={className}>
      <Label htmlFor={id} isRequired={isRequired}>
        {label}
      </Label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={handleChange}
          autoComplete={autoComplete}
          disabled={isDisabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          data-invalid={error ? true : undefined}
          className={twJoin(
            "block w-full rounded-xl border px-3 h-10 pr-10 text-sm bg-surface/60",
            "focus:outline-none focus:ring-4 disabled:opacity-50 transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-text-muted hover:border-border-strong",
            "border-border focus:border-primary/70 focus:ring-primary/15",
            "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger/15",
          )}
        />
        <IconButton
          tabIndex={-1}
          icon={visible ? faEyeSlash : faEye}
          ariaLabel={visible ? "Hide password" : "Show password"}
          onClick={handleToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
