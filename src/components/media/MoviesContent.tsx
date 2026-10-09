"use client";

import { MediaFile } from "@/src/types/MediaFile";
import MediaFileRow from "./MediaFileRow";

interface MoviesContentProps {
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}

export default function MoviesContent({
  files,
  onSelect,
  onEditOne,
}: MoviesContentProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {files.map((file) => (
        <MediaFileRow
          key={file.id}
          file={file}
          variant="movie"
          label={file.mediaInfo.title || "Not set"}
          onSelect={onSelect}
          onEditOne={onEditOne}
        />
      ))}
    </div>
  );
}
