import { ReactNode } from "react";

export type TableProps<T> = {
  children: (item: T) => ReactNode;
  items: T[];
};

export default function Table<T>({ children, items = [] }: TableProps<T>) {
  return (
    <div className="flex w-full h-full min-h-0 overflow-hidden rounded-lg border border-stone-200">
      <div className="flex flex-col gap-0.5 w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {items.map((item) => children(item))}
      </div>
    </div>
  );
}
