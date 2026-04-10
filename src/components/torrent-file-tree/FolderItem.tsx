"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import type { FolderNode } from "@/src/libs/torrent-file-tree";
import FileItem from "./FileItem";

type FolderItemProps = {
  node: FolderNode;
  depth: number;
  maxSize?: number;
};

export default function FolderItem({ node, depth, maxSize }: FolderItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 py-1 w-full text-left hover:opacity-70 transition-opacity"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          data-open={isOpen || undefined}
          className="text-neutral-400 shrink-0 text-xs transition-transform duration-200 data-open:rotate-90"
        />
        <FontAwesomeIcon
          icon={faFolder}
          className="text-yellow-500 shrink-0 text-xs"
        />
        <span className="text-sm font-medium break-all">{node.name}</span>
      </button>
      {isOpen && (
        <div>
          {node.children.map((child, i) =>
            child.type === "folder" ? (
              <FolderItem
                key={i}
                node={child}
                depth={depth + 1}
                maxSize={maxSize}
              />
            ) : (
              <FileItem
                key={i}
                node={child}
                depth={depth + 1}
                maxSize={maxSize}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
