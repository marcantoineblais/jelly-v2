import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type TableProps<T> = {
  children: (item: T, index: number) => ReactNode;
  items: T[];
  className?: string;
};

export default function Table<T>({
  children,
  items = [],
  className,
}: TableProps<T>) {
  return (
    <ul
      className={twMerge(
        "flex flex-col gap-2 w-full min-h-0 overflow-y-auto overflow-x-hidden pb-4 -mx-1 px-1",
        className,
      )}
    >
      {items.map((item, index) => children(item, index))}
    </ul>
  );
}
