import { formatDataSize } from "@/src/libs/format-data-size";
import type { QbitTorrent } from "@/src/libs/qbit/client";
import {
  formatEta,
  formatSpeed,
  formatState,
  getStatusCategory,
} from "@/src/libs/qbit/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faClock,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Progress from "../ui/Progress";
import { twJoin } from "tailwind-merge";

export type TorrentTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  item: QbitTorrent;
  index?: number;
};

const statusStyles: Record<string, { pill: string; bar: string }> = {
  downloading: {
    pill: "bg-status-downloading/12 text-status-downloading ring-status-downloading/25",
    bar: "bg-status-downloading",
  },
  stalled: {
    pill: "bg-status-stalled/12 text-status-stalled ring-status-stalled/25",
    bar: "bg-status-stalled",
  },
  completed: {
    pill: "bg-status-completed/12 text-status-completed ring-status-completed/25",
    bar: "bg-status-completed",
  },
  seeding: {
    pill: "bg-status-seeding/12 text-status-seeding ring-status-seeding/25",
    bar: "bg-status-completed",
  },
  paused: {
    pill: "bg-status-paused/12 text-status-paused ring-status-paused/25",
    bar: "bg-status-paused",
  },
  error: {
    pill: "bg-status-error/12 text-status-error ring-status-error/25",
    bar: "bg-status-error",
  },
  other: {
    pill: "bg-white/5 text-text-secondary ring-white/10",
    bar: "bg-text-muted",
  },
};

export default function TorrentTableItem({
  item,
  index = 0,
  onClick = () => {},
}: TorrentTableItemProps) {
  const status = getStatusCategory(item.state);
  const style = statusStyles[status] ?? statusStyles.other;
  const percent = Math.round((item.progress ?? 0) * 100);
  const isActive = status === "downloading";

  return (
    <li
      className="animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 15) * 25}ms` }}
    >
      <button
        data-status={status}
        className={twJoin(
          "group w-full text-start card rounded-2xl px-4 py-3.5 cursor-pointer",
          "transition-[border-color,background-color,transform] duration-200",
          "hover:border-border-strong hover:bg-surface-elevated active:scale-[0.99]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring",
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <p className="grow min-w-0 text-sm font-medium text-text leading-snug line-clamp-2 break-all">
            {item.name}
          </p>
          <span
            className={twJoin(
              "shrink-0 inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold ring-1 ring-inset",
              style.pill,
            )}
          >
            {formatState(item.state)}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={item.progress}
            isAnimated={isActive}
            className={style.bar}
          />
          <span className="shrink-0 w-10 text-right text-xs font-semibold tabular-nums text-text-secondary">
            {percent}%
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted tabular-nums">
          <span>
            {formatDataSize(item.completed)}
            <span className="text-text-muted/60"> / </span>
            {formatDataSize(item.size)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArrowDown} className="text-[10px]" />
            {formatSpeed(item.dlSpeed ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faArrowUp} className="text-[10px]" />
            {formatSpeed(item.upSpeed ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
            {item.numSeeds ?? "-"}/{item.numLeechs ?? "-"}
          </span>
          <span className="inline-flex items-center gap-1.5 ml-auto">
            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
            {formatEta(item.eta)}
          </span>
        </div>
      </button>
    </li>
  );
}
