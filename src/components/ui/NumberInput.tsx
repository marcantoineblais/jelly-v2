"use client";

import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

import FieldFrame, { fieldInputClassName } from "./FieldFrame";
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
    <FieldFrame
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      className={className}
      trailingClassName="flex-col justify-between p-1"
      trailing={
        <>
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
        </>
      }
    >
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
        className={twMerge(fieldInputClassName, "number-input pr-6")}
      />
    </FieldFrame>
  );
}
