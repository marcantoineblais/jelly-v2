"use client";

import { ReactNode } from "react";

import FieldFrame, {
  FieldClearButton,
  fieldInputClassName,
} from "./FieldFrame";

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

  const showClear = isClearable && Boolean(value);

  return (
    <FieldFrame
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      className={className}
      trailing={
        showClear && (
          <FieldClearButton onClick={handleClear} isDisabled={isDisabled} />
        )
      }
    >
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        autoComplete={autoComplete}
        disabled={isDisabled || undefined}
        data-trailing={showClear || undefined}
        data-invalid={Boolean(error) || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldInputClassName}
      />
    </FieldFrame>
  );
}
