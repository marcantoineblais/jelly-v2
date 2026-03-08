import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { buildTree } from "@/src/libs/torrent-file-tree";
import FolderItem from "./FolderItem";
import FileItem from "./FileItem";

type TorrentFileTreeProps = {
  files: QbitTorrentFile[];
  maxSize?: number;
};

export default function TorrentFileTree({ files, maxSize }: TorrentFileTreeProps) {
  const tree = buildTree(files);
  return (
    <div className="rounded-lg border border-stone-200 px-3 py-2 overflow-x-hidden">
      {tree.map((node, i) =>
        node.type === "folder" ? (
          <FolderItem key={i} node={node} depth={0} maxSize={maxSize} />
        ) : (
          <FileItem key={i} node={node} depth={0} maxSize={maxSize} />
        )
      )}
    </div>
  );
}
