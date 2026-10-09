"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { SortedMedia } from "@/src/types/SortedMedia";
import LibrarySectionCard from "./LibrarySectionCard";

type LibrarySectionListProps = {
  sections: SortedMedia;
  openSections: Set<string>;
  onToggleSection: (key: string) => void;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
  /** Prefix keeping section keys unique between views (e.g. "bin-"). */
  keyPrefix?: string;
};

export function getSectionKey(name: string, keyPrefix = "") {
  return `${keyPrefix}${name || "not-set"}`;
}

/** One card per library. */
export default function LibrarySectionList({
  sections,
  openSections,
  onToggleSection,
  onSelect,
  onEditOne,
  keyPrefix = "",
}: LibrarySectionListProps) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(sections).map(([name, files], index) => {
        const key = getSectionKey(name, keyPrefix);
        return (
          <LibrarySectionCard
            key={key}
            sectionKey={key}
            name={name}
            files={files}
            index={index}
            isOpen={openSections.has(key)}
            onToggle={() => onToggleSection(key)}
            onSelect={onSelect}
            onEditOne={onEditOne}
          />
        );
      })}
    </div>
  );
}
