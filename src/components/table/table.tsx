import { ReactNode } from "react";

export type TableProps<T> = {
  children: (item: T) => ReactNode;
  items: T[];
};

export default function Table<T>({ children, items = [] }: TableProps<T>) {
  return (
    <div className="flex w-full h-full max-h-fit overflow-hidden rounded-lg border border-stone-200">
      <div className="flex flex-col gap-0.5 w-full h-full overflow-y-auto overflow-x-hidden">
        {items.map((item) => children(item))}
      </div>
    </div>
  );
}
