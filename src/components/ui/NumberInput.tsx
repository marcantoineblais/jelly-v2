"use client";

import { ReactNode } from "react";
import { twJoin } from "tailwind-merge";

import Label from "./Label";
import IconButton from "./IconButton";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import useAutoTrigger from "@/src/hooks/useAutoTrigger";

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
  step?: number;
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
  step = 1,
  className,
}: NumberInputProps) {
  const { startTrigger, stopTrigger } = useAutoTrigger();

  function updateValue(updatedValue: number | null) {
    if (updatedValue != null) {
      if (!allowFloat) updatedValue = Math.floor(updatedValue);
      if (min != null) updatedValue = Math.max(updatedValue, min);
      if (max != null) updatedValue = Math.min(updatedValue, max);
    }

    if (error) validate(updatedValue);
    onChange(updatedValue);
    return updatedValue;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let updatedValue: number | null = e.currentTarget.valueAsNumber;
    if (isNaN(updatedValue)) updatedValue = null;

    updateValue(updatedValue);
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const target = e.currentTarget;
    if (value == null) {
      target.value = "";
    }
  }

  function handleIncrementHold() {
    if (isDisabled) return;
    let updatedValue: number | null = value ?? Math.max(min ?? 0, 0);

    const increment = () => {
      updatedValue = updateValue(updatedValue! + step);
    };

    startTrigger(increment, { interval: 100, initialWait: 300 });
  }

  function handleDecrementHold() {
    if (isDisabled) return;
    let updatedValue: number | null = value ?? Math.max(min ?? 0, 0);

    const decrement = () => {
      updatedValue = updateValue(updatedValue! - step);
    };

    startTrigger(decrement, { interval: 100, initialWait: 300 });
  }

  function handleRelease() {
    stopTrigger();
  }

  return (
    <div className={className}>
      <Label htmlFor={id} isRequired={isRequired}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={id}
          type="number"
          step={step}
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
            "number-input mt-1 block w-full rounded-md border pl-3 pr-6 h-9 text-sm bg-surface-card",
            "focus:outline-none focus:ring-1 disabled:opacity-50",
            "border-border focus:border-primary focus:ring-primary/50",
            "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger/50",
          )}
        />
        <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-between p-1">
          <IconButton
            ariaLabel="Increment"
            icon={faChevronUp}
            onPointerDown={handleIncrementHold}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            onContextMenu={(e) => e.preventDefault()}
            className="flex items-center h-4 overflow-hidden"
            size="xs"
          />

          <IconButton
            ariaLabel="Decrement"
            icon={faChevronDown}
            onPointerDown={handleDecrementHold}
            onPointerUp={handleRelease}
            onPointerLeave={handleRelease}
            onContextMenu={(e) => e.preventDefault()}
            className="flex items-center h-4 overflow-hidden"
            size="xs"
          />
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
