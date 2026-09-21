import { useMemo } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
  value?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Progress({ value = 0, className, ...props }: Props) {
  const progress = useMemo(() => Math.min(Math.max(value, 0), 1), [value]);

  return (
    <div
      className="w-full bg-gray-300 rounded-full h-2 overflow-hidden"
      {...props}
    >
      <div
        className={twMerge(
          "bg-primary h-full rounded-full duration-1000",
          className,
        )}
        style={{ width: `${progress * 100}%` }}
      ></div>
    </div>
  );
}
