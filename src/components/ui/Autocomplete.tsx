"use client";

import { startTransition, useEffect, useState } from "react";

import useFloatingOptions from "../../hooks/useFloatingOptions";
import FloatingOptions from "./FloatingOptions";
import FieldFrame, {
  FieldClearButton,
  fieldInputClassName,
} from "./FieldFrame";

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
  const {
    setIsOpen,
    setReference,
    onSelectKeyDown,
    isInFloating,
    floatingOptionsProps,
  } = useFloatingOptions({
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
    if (isInFloating(e.relatedTarget)) return;
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

  const showClear = isClearable && Boolean(value);

  return (
    <FieldFrame
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      className={className}
      onBlur={handleContainerBlur}
      trailing={
        showClear && (
          <FieldClearButton onClick={handleClear} isDisabled={isDisabled} />
        )
      }
    >
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
        data-trailing={showClear || undefined}
        data-invalid={error ? true : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        role="combobox"
        aria-expanded={floatingOptionsProps.isOpen || undefined}
        aria-controls={
          floatingOptionsProps.isOpen ? `${id}-listbox` : undefined
        }
        className={fieldInputClassName}
      />
      {/* Rendered in a portal; kept here so blur handling sees it as ours */}
      <FloatingOptions
        id={id}
        onSelect={handleSelect}
        {...floatingOptionsProps}
      />
    </FieldFrame>
  );
}
