import { formatDataSize } from "@/src/libs/format-data-size";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";

export type MetadataFilesItemProps = {
  file: QbitTorrentFile;
  maxSize: number;
};

export default function MetadataFilesItem({ file, maxSize }: MetadataFilesItemProps) {
  return (
    <li className="w-full py-0.5 first:pt-0 last:pb-0">
      <div className="p-4 flex flex-col gap-2">
        <span className="break-all text-sm min-w-0">{file.name}</span>
        <span className="whitespace-nowrap text-xs text-neutral-800 shrink-0">
          Size: {formatDataSize(file.size, { sizeRef: maxSize })}
        </span>
      </div>
    </li>
  );
}
