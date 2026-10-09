"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useMemo } from "react";
import MediaShow from "./MediaShow";

interface ShowsContentProps {
  sectionKey: string;
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}

export default function ShowsContent({
  sectionKey,
  files,
  onSelect,
  onEditOne,
}: ShowsContentProps) {
  const shows = useMemo(() => {
    const map = new Map<string, MediaFile[]>();
    files.forEach((file) => {
      const title = file.mediaInfo.title || "";
      map.set(title, [...(map.get(title) ?? []), file]);
    });
    return Array.from(map.entries());
  }, [files]);

  return (
    <div className="flex flex-col gap-0.5">
      {shows.map(([title, showFiles], index) => {
        const key = `${sectionKey}-${title || `untitled-${index}`}`;
        return (
          <MediaShow
            key={key}
            id={key}
            title={title}
            files={showFiles}
            onSelect={onSelect}
            onEditOne={onEditOne}
          />
        );
      })}
    </div>
  );
}
