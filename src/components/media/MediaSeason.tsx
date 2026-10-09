"use client";

import { MediaFile } from "@/src/types/MediaFile";
import SelectableRow from "./SelectableRow";
import { getSelectionStats } from "@/src/libs/files/getSelectionStats";
import MediaFileRow from "./MediaFileRow";
import Chip from "../ui/Chip";

export default function MediaSeason({
  id,
  label,
  files,
  onSelect,
  onEditOne,
}: {
  id: string;
  label: string;
  files: MediaFile[];
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}) {
  const { isAllSelected, isPartiallySelected } = getSelectionStats(files);

  return (
    <div className="flex flex-col">
      <SelectableRow
        id={id}
        files={files}
        label={label}
        labelClassName="text-xs uppercase tracking-wider text-text-muted font-semibold"
        className="py-1.5"
        isSelected={isAllSelected}
        isIndeterminate={isPartiallySelected}
        onSelect={onSelect}
        trailing={
          <Chip>
            {files.length} ep{files.length > 1 ? "s" : ""}
          </Chip>
        }
      />
      <div className="ml-5 pl-2 border-l border-border flex flex-col gap-0.5">
        {files.map((file) => (
          <MediaFileRow
            key={file.id}
            file={file}
            variant="episode"
            label={file.mediaInfo.title ?? "No title"}
            onSelect={onSelect}
            onEditOne={onEditOne}
          />
        ))}
      </div>
    </div>
  );
}
