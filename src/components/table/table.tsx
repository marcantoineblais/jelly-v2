import { ReactNode } from "react";

export type TableProps<T> = {
  children: (item: T) => ReactNode;
  items: T[];
};

export default function Table<T>({ children, items = [] }: TableProps<T>) {
  return (
    <div className="flex flex-col w-full h-full rounded-lg border border-stone-200 overflow-hidden">
      <div className="block w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-0.5">
        {items.map((item) => children(item))}
      </div>
    </div>
  );
}
