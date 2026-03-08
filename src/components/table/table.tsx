import { ReactNode } from "react";

export type TableProps<T> = {
  children: (item: T) => ReactNode;
  items: T[];
};

export default function Table<T>({ children, items = [] }: TableProps<T>) {
  return (
    <div className="flex flex-col w-full max-h-full overflow-hidden">
      <div className="flex flex-col w-full h-full rounded-lg border border-stone-200 overflow-hidden">
        <ul className="w-full overflow-y-auto overflow-x-hidden">
          {items.map((item) => children(item))}
        </ul>
      </div>
    </div>
  );
}
