import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  value?: number;
  className?: string;
  trackClassName?: string;
  /** Shows a moving sheen on the bar (for active transfers). */
  isAnimated?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Progress({
  value = 0,
  className,
  trackClassName,
  isAnimated = false,
  ...props
}: Props) {
  const progress = useMemo(() => Math.min(Math.max(value, 0), 1), [value]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className={twMerge(
        "w-full bg-white/8 rounded-full h-1.5 overflow-hidden",
        trackClassName,
      )}
    >
      <div
        className={twMerge(
          "relative bg-primary h-full rounded-full transition-[width] duration-700 ease-out overflow-hidden",
          className,
        )}
        style={{ width: `${progress * 100}%` }}
        {...props}
      >
        {isAnimated && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-shimmer bg-size-[200%_100%] bg-linear-to-r from-transparent via-white/35 to-transparent"
          />
        )}
      </div>
    </div>
  );
}
