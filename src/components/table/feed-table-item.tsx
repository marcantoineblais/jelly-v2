import { FeedItem } from "@/src/libs/downloads/feed-format";

export type FeedTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  item: FeedItem;
};
export default function FeedTableItem({
  item,
  onClick = () => {},
}: FeedTableItemProps) {
  return (
    <li className="w-full py-0.5 first:pt-0 last:pb-0">
      <button
        className="flex flex-col w-full text-start overflow-hidden p-4 bg-white cursor-pointer hover:bg-stone-50 duration-200"
        onClick={onClick}
      >
        <p className="whitespace-nowrap overflow-hidden w-full truncate">
          {item.title}
        </p>
        <div className="pt-1.5 flex justify-between text-xs text-neutral-500">
          <span className="whitespace-nowrap overflow-hidden w-full truncate">
            Size: {item.size}
          </span>
          <span className="text-center whitespace-nowrap overflow-hidden w-full truncate">
            Seeds: {item.seeds}
          </span>
          <span className="text-right whitespace-nowrap overflow-hidden w-full truncate">
            Leech: {item.leech}
          </span>
        </div>
        <div className="text-xs text-neutral-500">{item.pubDate}</div>
      </button>
    </li>
  );
}
