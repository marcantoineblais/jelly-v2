"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { startTransition, useEffect, useState } from "react";
import { twJoin } from "tailwind-merge";

import useFloatingOptions from "../../hooks/useFloatingOptions";
import FloatingOptions from "./FloatingOptions";
import IconButton from "./IconButton";
import Label from "./Label";

type Props = {
  id: string;
  value?: string;
  label?: string;
  className?: string;
  placeholder?: string;
  options?: Option[];
  useCoordinates?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
  isClearable?: boolean;
  error?: string;
  initialInput?: string;
  onChange: (value: string) => void;
  validate?: (value: string) => void;
};

type Option = {
  label: string;
  value: string;
  detail?: string;
};

export default function Autocomplete({
  id,
  value = "",
  label = "",
  placeholder = "",
  options = [],
  className = "",
  isDisabled = false,
  isRequired = false,
  isClearable = true,
  error,
  onChange,
  validate = () => {},
}: Props) {
  const [suggestions, setSuggestions] = useState<Option[]>(options);
  const { setIsOpen, setReference, onSelectKeyDown, floatingOptionsProps } =
    useFloatingOptions({
      options: suggestions,
    });

  useEffect(() => {
    startTransition(() => setSuggestions(options));
  }, [options]);

  function handleClear() {
    if (error) validate("");
    onChange("");
    setSuggestions(options);
  }

  function handleSelect(value: string) {
    setIsOpen(false);
    const suggestion = suggestions.find((s) => s.value === value);
    if (!suggestion) return;

    onChange(suggestion.value);
  }

  function handleFocus() {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsOpen(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;
    const updatedSuggestions = options.filter((suggestion) =>
      suggestion.label.toLowerCase().includes(value.toLowerCase()),
    );

    setSuggestions(updatedSuggestions);
    setIsOpen(updatedSuggestions.length > 0);
    onChange(value);
  }

  return (
    <>
      <div className={className} onBlur={handleContainerBlur}>
        <Label htmlFor={id} isRequired={isRequired && Boolean(label)}>
          {label}
        </Label>

        <div className="relative w-full">
          <input
            ref={setReference}
            id={id}
            type="text"
            value={value}
            disabled={isDisabled}
            placeholder={placeholder}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={onSelectKeyDown}
            autoComplete="off"
            data-clearable={isClearable || undefined}
            data-invalid={error ? true : undefined}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            role="combobox"
            aria-expanded={floatingOptionsProps.isOpen || undefined}
            aria-controls={
              floatingOptionsProps.isOpen ? `${id}-listbox` : undefined
            }
            className={twJoin(
              "mt-1 block w-full min-w-48 rounded border px-3 h-9 text-sm bg-surface-card border-border",
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
              isDisabled={isDisabled}
            />
          )}
        </div>

        <FloatingOptions
          id={id}
          onSelect={handleSelect}
          {...floatingOptionsProps}
        />
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
