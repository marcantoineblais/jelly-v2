"use client";

import { MediaFile } from "@/src/types/MediaFile";
import ShowsContent from "./ShowsContent";
import MoviesContent from "./MoviesContent";

interface LibrarySectionContentProps {
  sectionKey: string;
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}

export default function LibrarySectionContent({
  sectionKey,
  files,
  onSelect,
  onEditOne,
}: LibrarySectionContentProps) {
  if (files.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-text-muted">Empty</div>
    );
  }

  const type = files[0]?.library.type ?? null;

  if (type === "show") {
    return (
      <ShowsContent
        sectionKey={sectionKey}
        files={files}
        onSelect={onSelect}
        onEditOne={onEditOne}
      />
    );
  }

  return (
    <MoviesContent files={files} onSelect={onSelect} onEditOne={onEditOne} />
  );
}
