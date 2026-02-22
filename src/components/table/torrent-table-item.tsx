import { formatDataSize } from "@/src/libs/format-data-size";
import type { QbitTorrent } from "@/src/libs/qbit/client";
import { formatEta, formatSpeed, formatState } from "@/src/libs/qbit/format";
import { Progress } from "@heroui/react";

export type TorrentTableItemProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  item: QbitTorrent;
};

export default function TorrentTableItem({
  item,
  onClick = () => {},
}: TorrentTableItemProps) {
  return (
    <div
      className="flex flex-col w-full min-h-fit overflow-hidden p-4 bg-white"
      onClick={onClick}
    >
      <p className="whitespace-nowrap overflow-hidden w-full truncate">
        {item.name}
      </p>
      <div className="w-full">
        <Progress value={item.progress * 100} color="primary" aria-label="Progress"/>
        <div className="flex justify-between content-between text-xs">
          <span className="truncate">{formatDataSize(item.completed)}</span>
          <span className="truncate">{formatDataSize(item.size)}</span>
        </div>
      </div>

      <div className="pt-2 flex justify-between text-xs text-neutral-500">
        <span className="basis-1/2 whitespace-nowrap">
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
