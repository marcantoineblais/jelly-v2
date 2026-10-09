"use client";

import { MediaFile } from "@/src/types/MediaFile";
import MediaCheckbox from "./MediaCheckbox";
import MediaFileRow from "./MediaFileRow";
import Chip from "../ui/Chip";

export default function MediaSeason({
  id,
  label,
  files = [],
  showHeader = true,
  handleSelect = () => {},
  onEditOne,
}: {
  id: string;
  label: string;
  files?: MediaFile[];
  showHeader?: boolean;
  handleSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}) {
  const selectedCount = files.filter((f) => f.isSelected).length;

  return (
    <div className="flex flex-col">
      {showHeader && (
        <MediaCheckbox
          id={id}
          files={files}
          label={label}
          labelClassName="text-xs uppercase tracking-wider text-text-muted font-semibold"
          className="py-1.5"
          isSelected={files.length > 0 && selectedCount === files.length}
          isIndeterminate={selectedCount > 0}
          onSelect={handleSelect}
          trailing={
            <Chip>
              {files.length} ep{files.length > 1 ? "s" : ""}
            </Chip>
          }
        />
      )}
      <div className="ml-5 pl-2 border-l border-border flex flex-col gap-0.5">
        {files.map((file) => (
          <MediaFileRow
            key={file.id}
            file={file}
            variant="episode"
            label={file.mediaInfo.title ?? "No title"}
            onSelect={handleSelect}
            onEditOne={onEditOne}
          />
        ))}
      </div>
    </div>
  );
}
