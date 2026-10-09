"use client";

import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { ReactNode, useState } from "react";

import IconButton from "./IconButton";
import FieldFrame, { fieldInputClassName } from "./FieldFrame";

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
    <FieldFrame
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      className={className}
      trailing={
        <IconButton
          tabIndex={-1}
          icon={visible ? faEyeSlash : faEye}
          ariaLabel={visible ? "Hide password" : "Show password"}
          onClick={handleToggle}
          className="size-7 rounded-lg flex items-center justify-center hover:bg-surface-hover"
        />
      }
    >
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
        data-trailing
        className={fieldInputClassName}
      />
    </FieldFrame>
  );
}
