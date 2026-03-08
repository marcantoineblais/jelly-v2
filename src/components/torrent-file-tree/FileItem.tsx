import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile } from "@fortawesome/free-solid-svg-icons";
import { formatDataSize } from "@/src/libs/format-data-size";
import type { FileNode } from "@/src/libs/torrent-file-tree";

type FileItemProps = {
  node: FileNode;
  depth: number;
  maxSize?: number;
};

export default function FileItem({ node, depth, maxSize }: FileItemProps) {
  return (
    <div
      className="flex items-start gap-2 py-1"
      style={{ paddingLeft: `${depth * 1.25}rem` }}
    >
      <FontAwesomeIcon
        icon={faFile}
        className="text-neutral-400 shrink-0 text-xs mt-1"
      />
      <span className="break-all text-sm min-w-0 flex-1">{node.name}</span>
      <span className="whitespace-nowrap text-xs text-neutral-500 shrink-0 mt-0.5">
        {formatDataSize(node.file.size, { sizeRef: maxSize })}
      </span>
    </div>
  );
}
