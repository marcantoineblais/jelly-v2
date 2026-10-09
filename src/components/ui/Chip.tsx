import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type ChipColor = "default" | "primary" | "danger" | "warning" | "info";

const chipColors: Record<ChipColor, string> = {
  default: "bg-white/5 text-text-secondary ring-white/8",
  primary: "bg-primary/12 text-primary-light ring-primary/25",
  danger: "bg-danger/12 text-danger-light ring-danger/30",
  warning: "bg-warning/12 text-warning ring-warning/30",
  info: "bg-info/12 text-info ring-info/25",
};

export default function Chip({
  children,
  color = "default",
  className,
  mono = false,
}: {
  children: ReactNode;
  color?: ChipColor;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      className={twMerge(
        "inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        mono && "font-mono tracking-tight",
        chipColors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
