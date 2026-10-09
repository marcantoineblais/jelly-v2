import { twMerge } from "tailwind-merge";

export default function MediaInfoLine({
  label = "",
  content = "",
  mono = false,
  className,
}: {
  label?: string;
  content?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={twMerge("min-w-0 flex flex-col gap-0.5", className)}>
      <dt className="text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd
        className={twMerge(
          "text-sm text-text-secondary break-all",
          mono && "font-mono text-xs leading-5",
        )}
      >
        <article>{content}</article>
      </dd>
    </div>
  );
}
