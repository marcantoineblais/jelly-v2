import { formatDataSize } from "@/src/libs/format-data-size";
import type { QbitTorrent } from "@/src/libs/qbit/client";
import {
  formatEta,
  formatSpeed,
  formatState,
  getStatusCategory,
} from "@/src/libs/qbit/format";
import { Progress } from "@heroui/react";

export type TorrentTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  item: QbitTorrent;
};

export default function TorrentTableItem({
  item,
  onClick = () => {},
}: TorrentTableItemProps) {
  const status = getStatusCategory(item.state);

  return (
    <div
      data-status={status}
      className={[
        "flex flex-col w-full min-h-fit overflow-hidden p-4 bg-white border-l-4 border-l-transparent",
        "data-[status=downloading]:border-l-status-downloading",
        "data-[status=stalled]:border-l-status-stalled data-[status=stalled]:bg-status-stalled/5",
        "data-[status=completed]:border-l-status-completed data-[status=completed]:bg-status-completed/5",
        "data-[status=seeding]:border-l-status-completed data-[status=seeding]:bg-status-completed/5",
        "data-[status=paused]:border-l-status-paused data-[status=paused]:bg-status-paused/5",
        "data-[status=error]:border-l-status-error data-[status=error]:bg-status-error/5",
      ].join(" ")}
      onClick={onClick}
    >
      <p className="whitespace-nowrap overflow-hidden w-full truncate">
        {item.name}
      </p>
      <div className="w-full">
        <Progress
          data-status={status}
          className="group"
          classNames={{
            indicator: [
              "group-data-[status=downloading]:bg-status-downloading",
              "group-data-[status=stalled]:bg-status-stalled",
              "group-data-[status=completed]:bg-status-completed",
              "group-data-[status=seeding]:bg-status-completed",
              "group-data-[status=paused]:bg-status-paused",
              "group-data-[status=error]:bg-status-error",
            ].join(" "),
          }}
          value={item.progress * 100}
          aria-label="Progress"
        />
        <div className="flex justify-between content-between text-xs">
          <span className="truncate">{formatDataSize(item.completed)}</span>
          <span className="truncate">{formatDataSize(item.size)}</span>
        </div>
      </div>

      <div className="pt-2 flex justify-between text-xs text-neutral-500">
        <span
          data-status={status}
          className={[
            "basis-1/2 whitespace-nowrap font-medium",
            "data-[status=downloading]:text-status-downloading",
            "data-[status=stalled]:text-status-stalled",
            "data-[status=completed]:text-status-completed",
            "data-[status=seeding]:text-status-completed",
            "data-[status=paused]:text-status-paused",
            "data-[status=error]:text-status-error",
          ].join(" ")}
        >
          {formatState(item.state)}
        </span>
        <span className="basis-1/2 whitespace-nowrap">
          ETA: {formatEta(item.eta)}
        </span>
      </div>

      <div className="flex justify-between text-xs text-neutral-500">
        <span className="basis-1/2 whitespace-nowrap">
          Seeds: {item.numSeeds ?? "-"}
        </span>
        <span className="basis-1/2 whitespace-nowrap">
          Down: {formatSpeed(item.dlSpeed ?? 0)}
        </span>
      </div>

      <div className="flex justify-between text-xs text-neutral-500">
        <span className="basis-1/2 whitespace-nowrap">
          Leech: {item.numLeechs ?? "-"}
        </span>
        <span className="basis-1/2 whitespace-nowrap">
          Up: {formatSpeed(item.upSpeed ?? 0)}
        </span>
      </div>
    </div>
  );
}
