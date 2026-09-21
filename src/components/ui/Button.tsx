"use client";

import { ButtonHTMLAttributes, ReactNode, useMemo } from "react";
import { twJoin, twMerge } from "tailwind-merge";

type ButtonColor =
  | "primary"
  | "secondary"
  | "info"
  | "danger"
  | "warning"
  | "success"
  | "default";

type ButtonSize = "small" | "medium" | "large";

type ButtonProps = {
  ref?: React.Ref<HTMLButtonElement>;
  color?: ButtonColor;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  color = "primary",
  isLoading = false,
  isDisabled = false,
  size = "medium",
  className,
  onClick = () => {},
  children,
  ...props
}: ButtonProps) {
  const colorClasses: Record<ButtonColor, string> = useMemo(
    () => ({
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary-ring disabled:bg-primary",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary-hover focus:ring-secondary disabled:bg-secondary",
      danger:
        "bg-danger text-danger-foreground hover:bg-danger-hover focus:ring-danger-ring disabled:bg-danger",
      warning:
        "bg-warning text-warning-foreground hover:bg-warning-hover focus:ring-warning disabled:bg-warning",
      success:
        "bg-success text-success-foreground hover:bg-success-hover focus:ring-success disabled:bg-success",
      info: "bg-info text-info-foreground hover:bg-info-hover focus:ring-info disabled:bg-info",
      default:
        "bg-surface-card text-text border border-border hover:bg-surface focus:ring-border disabled:bg-surface-card",
    }),
    [],
  );

  const sizeClasses: Record<ButtonSize, string> = useMemo(
    () => ({
      small: "h-8 px-2 text-sm",
      medium: "h-10 px-4 text-base",
      large: "h-12 px-8 text-lg",
    }),
    [],
  );

  const blinkers = (
    <span className="h-full flex items-center gap-1" aria-label="Loading">
      <span className="inline-block size-1.5 rounded-full bg-current animate-[blink_1.2s_ease-in-out_infinite]" />
      <span className="inline-block size-1.5 rounded-full bg-current animate-[blink_1.2s_ease-in-out_infinite] [animation-delay:0.2s]" />
      <span className="inline-block size-1.5 rounded-full bg-current animate-[blink_1.2s_ease-in-out_infinite] [animation-delay:0.4s]" />
    </span>
  );

  return (
    <button
      {...props}
      disabled={isDisabled || isLoading || undefined}
      className={twMerge(
        "relative rounded-lg min-w-16 cursor-pointer flex items-center justify-center font-semibold overflow-hidden duration-200",
        colorClasses[color],
        sizeClasses[size],
        "disabled:opacity-50 disabled:cursor-default",
        className,
      )}
      onClick={onClick}
    >
      {isLoading ? (
        <span
          className={twJoin(
            "absolute inset-0 flex items-center justify-center",
          )}
        >
          {blinkers}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
