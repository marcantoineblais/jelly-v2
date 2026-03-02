"use client";

import { MediaFile } from "@/src/types/MediaFile";
import ShowsContent from "./ShowsContent";
import MoviesContent from "./MoviesContent";

interface LibrarySectionContentProps {
  sectionKey: string;
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
}

export default function LibrarySectionContent({
  sectionKey,
  files,
  onSelect,
}: LibrarySectionContentProps) {
  if (files.length === 0) {
    return <div className="text-center">Empty</div>;
  }

  const type = files[0]?.library.type ?? null;

  if (type === "show") {
    return (
      <ShowsContent sectionKey={sectionKey} files={files} onSelect={onSelect} />
    );
  }

  if (type === "movie" || type == null) {
    return (
      <MoviesContent
        sectionKey={sectionKey}
        files={files}
        onSelect={onSelect}
      />
    );
  }

  return <div className="text-center">Empty</div>;
}
