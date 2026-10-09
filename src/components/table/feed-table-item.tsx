import {
  faArrowDown,
  faArrowUp,
  faCalendar,
  faHardDrive,
} from "@fortawesome/free-solid-svg-icons";
import { FeedItem } from "@/src/libs/downloads/feed-format";
import TableItemButton from "./table-item-button";
import TableStat, { TableStats } from "./table-stat";

export type FeedTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  item: FeedItem;
  index?: number;
};

function seedsClassName(seeds: number) {
  if (seeds >= 10) return "text-primary-light";
  if (seeds > 0) return "text-warning";
  return "text-danger-light";
}

export default function FeedTableItem({
  item,
  index,
  onClick,
}: FeedTableItemProps) {
  return (
    <TableItemButton index={index} onClick={onClick}>
      <p className="text-sm font-medium text-text leading-snug line-clamp-2 break-all">
        {item.title}
      </p>
      <TableStats>
        <TableStat icon={faHardDrive}>{item.size ?? "—"}</TableStat>
        <TableStat icon={faArrowUp} className={seedsClassName(item.seeds ?? 0)}>
          {item.seeds ?? "—"}
        </TableStat>
        <TableStat icon={faArrowDown}>{item.leech ?? "—"}</TableStat>
        <TableStat icon={faCalendar} className="ml-auto">
          {item.pubDate}
        </TableStat>
      </TableStats>
    </TableItemButton>
  );
}
