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
  | "default"
  | "ghost";

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
        "bg-primary text-primary-foreground shadow-btn hover:bg-primary-hover hover:shadow-glow focus-visible:ring-primary-ring disabled:hover:bg-primary disabled:hover:shadow-btn",
      secondary:
        "bg-secondary text-secondary-foreground shadow-btn hover:bg-secondary-hover focus-visible:ring-secondary/50 disabled:hover:bg-secondary",
      danger:
        "bg-danger text-danger-foreground shadow-btn hover:bg-danger-hover focus-visible:ring-danger-ring disabled:hover:bg-danger",
      warning:
        "bg-warning text-warning-foreground shadow-btn hover:bg-warning-hover focus-visible:ring-warning/50 disabled:hover:bg-warning",
      success:
        "bg-success text-success-foreground shadow-btn hover:bg-success-hover focus-visible:ring-success/50 disabled:hover:bg-success",
      info: "bg-info text-info-foreground shadow-btn hover:bg-info-hover focus-visible:ring-info/50 disabled:hover:bg-info",
      default:
        "bg-surface-elevated text-text border border-border shadow-btn hover:bg-surface-hover hover:border-border-strong focus-visible:ring-border-strong disabled:hover:bg-surface-elevated",
      ghost:
        "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text focus-visible:ring-border-strong",
    }),
    [],
  );

  const sizeClasses: Record<ButtonSize, string> = useMemo(
    () => ({
      small: "h-8 px-3 text-sm gap-1.5",
      medium: "h-10 px-4 text-sm gap-2",
      large: "h-12 px-6 text-base gap-2",
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
        "relative rounded-xl min-w-16 cursor-pointer inline-flex items-center justify-center font-semibold overflow-hidden select-none",
        "transition-[background-color,box-shadow,transform,opacity,border-color] duration-200 active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2",
        colorClasses[color],
        sizeClasses[size],
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
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
