"use client";

import { faChevronDown, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode, useCallback, useMemo } from "react";
import { twJoin, twMerge } from "tailwind-merge";

import useFloatingOptions from "../../hooks/useFloatingOptions";
import FloatingOptions, { Option } from "./FloatingOptions";
import IconButton from "./IconButton";
import Label from "./Label";

type Props<T> = {
  id: string;
  label?: ReactNode;
  isRequired?: boolean;
  options: Option<T>[];
  value: Set<T | undefined>;
  disabledOptions?: Set<T>;
  onChange: (value: Set<T | undefined>) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  validate?: (value: Set<T | undefined>) => void;
  isClearable?: boolean;
  onClear?: () => void;
  autoFocusSearch?: boolean;
  isDisabled?: boolean;
  isSearchable?: boolean;
  onSearchChange?: (value: string) => void;
  isMultiple?: boolean;
  className?: string;
  noResultPlaceholder?: ReactNode;
  searchFooter?: ReactNode;
  minSearchLength?: number;
};

export default function SelectInput<T>({
  id,
  label = "",
  isRequired = false,
  options,
  value,
  disabledOptions = new Set(),
  onChange,
  placeholder,
  searchPlaceholder,
  error,
  validate = () => {},
  isDisabled,
  isClearable = false,
  isSearchable = false,
  autoFocusSearch = false,
  onClear,
  onSearchChange,
  isMultiple = false,
  className,
  noResultPlaceholder,
  minSearchLength = 0,
  searchFooter,
}: Props<T>) {
  const {
    isOpen,
    setIsOpen,
    setSearch,
    reference,
    setReference,
    onSelectKeyDown,
    floatingOptionsProps,
  } = useFloatingOptions({
    options,
    isSearchable,
    onSearchChange,
  });

  const canClear = isClearable && hasValue();
  const showPlaceholder = useMemo(
    () => value.size === 0 || [...value][0] == null || [...value][0] === "",
    [value],
  );
  const displayText = useMemo(() => {
    if (showPlaceholder) return placeholder ?? "";
    if (value.size === 1) {
      const first = [...value][0];
      const match = options.find((o) => o.value === first);
      return match?.label ?? first?.toString() ?? "";
    }
    return `${value.size} item${value.size > 1 ? "s" : ""}`;
  }, [value, options, placeholder, showPlaceholder]);

  const handleSelect = useCallback(
    (selectedOption: T) => {
      if (!value.has(selectedOption) && disabledOptions.has(selectedOption))
        return;

      const wasSelected = value.has(selectedOption);

      if (isMultiple) {
        const updatedValue = new Set(
          [...value].filter((el) => el != undefined && el !== ""),
        );

        if (wasSelected) {
          updatedValue.delete(selectedOption);
        } else {
          updatedValue.add(selectedOption);
        }

        if (error) validate(updatedValue);
        onChange(updatedValue);
      } else {
        const updatedValue = wasSelected
          ? new Set<T>()
          : new Set([selectedOption]);

        if (error) validate(updatedValue);
        onChange(updatedValue);
        setIsOpen(false);
      }
    },
    [value, isMultiple, onChange, setIsOpen, error, validate, disabledOptions],
  );

  function handleClickOutside() {
    setIsOpen(false);
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    handleClickOutside();
  }

  function handleOpen() {
    setIsOpen(!isDisabled && !isOpen);
  }

  function getSelectedStyle(): React.CSSProperties | undefined {
    if (value.size !== 1) return undefined;

    const first = [...value][0];
    return options.find((o) => o.value === first)?.style;
  }

  function handleClear(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();

    const updatedValue = new Set<T | undefined>([]);
    if (error) validate(updatedValue);

    onChange(updatedValue);
    onClear?.();
    setSearch("");
    onSearchChange?.("");

    if (reference.current instanceof HTMLElement) {
      reference.current.focus();
    }
  }

  function hasValue() {
    if (value.size === 0) return false;
    const elements = Array.from(value);
    return elements.some((el) => el !== undefined && el !== null && el !== "");
  }

  function handleSelectAll() {
    const updatedValue = new Set<T | undefined>(
      options.filter((o) => !disabledOptions.has(o.value)).map((o) => o.value),
    );
    if (error) validate(updatedValue);
    onChange(updatedValue);
  }

  function handleDeselectAll() {
    const updatedValue = new Set<T | undefined>([]);
    if (error) validate(updatedValue);
    onChange(updatedValue);
  }

  return (
    <div
      className={twMerge("min-w-36", className)}
      data-open={isOpen ? true : undefined}
      onBlur={handleContainerBlur}
    >
      {label && (
        <Label htmlFor={id} isRequired={isRequired}>
          {label}
        </Label>
      )}
      <div className="relative w-full">
        <button
          ref={setReference}
          id={id}
          type="button"
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={isDisabled}
          data-invalid={Boolean(error) || undefined}
          data-placeholder={showPlaceholder || undefined}
          onKeyDown={onSelectKeyDown}
          className={twJoin(
            "relative flex w-full items-center justify-between rounded-md border pl-3 pr-9 h-9 text-sm text-left bg-surface-card overflow-hidden",
            "focus:outline-none focus:ring-1 disabled:opacity-50",
            "border-border focus:border-primary focus:ring-primary/50",
            "data-invalid:border-danger-light data-invalid:focus:border-danger data-invalid:focus:ring-danger/50",
            "data-placeholder:text-text-muted",
          )}
        >
          <div className="truncate grow" style={getSelectedStyle()}>
            {displayText}
          </div>
        </button>

        <div
          className="absolute inset-y-0 right-0 px-3 flex items-center data-dropdown:pointer-events-none"
          data-dropdown={!canClear || undefined}
        >
          {canClear ? (
            <IconButton
              icon={faXmark}
              onClick={handleClear}
              ariaLabel="Clear"
              isDisabled={isDisabled}
            />
          ) : (
            <FontAwesomeIcon
              icon={faChevronDown}
              data-disabled={isDisabled || undefined}
              className="data-disabled:text-text-muted"
            />
          )}
        </div>
      </div>

      <FloatingOptions
        value={value}
        onSelect={(value) => handleSelect(value as T)}
        id={id}
        searchFooter={searchFooter}
        noResultPlaceholder={noResultPlaceholder}
        isMultiple={isMultiple}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        autoFocusSearch={autoFocusSearch}
        minSearchLength={minSearchLength}
        disabledOptions={disabledOptions}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        isSearchable={isSearchable}
        {...floatingOptionsProps}
      />

      {error && (
        <p className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
