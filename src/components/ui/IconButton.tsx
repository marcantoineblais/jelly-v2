"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonHTMLAttributes, ComponentProps, Ref, useMemo } from "react";
import { twMerge } from "tailwind-merge";

type IconButtonColor = "default" | "danger" | "primary" | "success" | "warning";
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "type" | "role" | "onClick" | "className" | "disabled"
>;

type IconButtonProps = {
  ref?: Ref<HTMLButtonElement>;
  icon: IconDefinition;
  title?: string;
  color?: IconButtonColor;
  ariaLabel: string;
  size?: ComponentProps<typeof FontAwesomeIcon>["size"];
  isDisabled?: boolean;
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  role?: ButtonHTMLAttributes<HTMLButtonElement>["role"];
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
} & NativeButtonProps;

export default function IconButton({
  ref,
  icon,
  title,
  ariaLabel,
  className,
  color = "default",
  size = "1x",
  type = "button",
  role,
  isDisabled = false,
  onClick,
  ...props
}: IconButtonProps) {
  const hoverClasses: Record<IconButtonColor, string> = useMemo(
    () => ({
      default: "hover:text-text-hover",
      danger: "hover:text-danger-hover",
      primary: "hover:text-primary-hover",
      success: "hover:text-success-hover",
      warning: "hover:text-warning-hover",
    }),
    [],
  );

  return (
    <button
      ref={ref}
      type={type}
      role={role}
      title={title ?? ariaLabel}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      className={twMerge(
        "text-text-muted transition-colors duration-200 cursor-pointer",
        "disabled:opacity-50 disabled:text-text-muted disabled:hover:text-text-muted",
        hoverClasses[color],
        className,
      )}
      {...props}
    >
      <FontAwesomeIcon icon={icon} size={size} />
    </button>
  );
}
