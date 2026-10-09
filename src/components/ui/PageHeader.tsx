import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "flex items-end justify-between gap-4 animate-fade-in",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-muted truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
