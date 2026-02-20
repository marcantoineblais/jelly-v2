import { FeedItem } from "@/src/libs/torrents/feed-format";

export type FeedTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  item: FeedItem;
};
export default function FeedTableItem({
  item,
  onClick = () => {},
}: FeedTableItemProps) {
  return (
    <div
      className="flex flex-col w-full min-h-fit overflow-hidden p-4 bg-white"
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
    </div>
  );
}
