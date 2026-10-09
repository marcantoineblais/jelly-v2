import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faCalendar,
  faHardDrive,
} from "@fortawesome/free-solid-svg-icons";
import { FeedItem } from "@/src/libs/downloads/feed-format";
import { twJoin } from "tailwind-merge";

export type FeedTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  item: FeedItem;
  index?: number;
};

export default function FeedTableItem({
  item,
  index = 0,
  onClick = () => {},
}: FeedTableItemProps) {
  const seeds = item.seeds ?? 0;

  return (
    <li
      className="animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 15) * 25}ms` }}
    >
      <button
        className={twJoin(
          "group w-full text-start card rounded-2xl px-4 py-3.5 cursor-pointer",
          "transition-[border-color,background-color,transform] duration-200",
          "hover:border-border-strong hover:bg-surface-elevated active:scale-[0.99]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
        )}
        onClick={onClick}
      >
        <p className="text-sm font-medium text-text leading-snug line-clamp-2 break-all group-hover:text-white">
          {item.title}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted tabular-nums">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faHardDrive} className="text-[10px]" />
            {item.size ?? "—"}
          </span>
          <span
            className={twJoin(
              "inline-flex items-center gap-1.5",
              seeds >= 10
                ? "text-primary-light"
                : seeds > 0
                  ? "text-warning"
                  : "text-danger-light",
            )}
          >
            <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
            {item.seeds ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" />
            {item.leech ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <FontAwesomeIcon icon={faCalendar} className="text-[10px]" />
            {item.pubDate}
          </span>
        </div>
      </button>
    </li>
  );
}
