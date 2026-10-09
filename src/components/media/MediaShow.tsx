"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useMemo, useState } from "react";
import { faTv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatNumber } from "@/src/libs/files/formatNumber";
import { formatDataSize } from "@/src/libs/format-data-size";
import SelectableRow from "./SelectableRow";
import MediaSeason from "./MediaSeason";
import Collapse from "../ui/Collapse";
import Chip from "../ui/Chip";
import ExpandButton from "../ui/ExpandButton";
import { getSelectionStats } from "@/src/libs/files/getSelectionStats";

export default function MediaShow({
  id,
  title,
  files,
  onSelect,
  onEditOne,
}: {
  id: string;
  title: string;
  files: MediaFile[];
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const seasons = useMemo(() => {
    const map = new Map<number | undefined, MediaFile[]>();
    files.forEach((file) => {
      const key = file.mediaInfo.season;
      map.set(key, [...(map.get(key) ?? []), file]);
    });
    return Array.from(map.entries());
  }, [files]);

  const {
    selectedCount,
    isAllSelected,
    isPartiallySelected,
    errorCount,
    totalSize,
  } = getSelectionStats(files);

  return (
    <div
      data-open={isOpen || undefined}
      className="rounded-xl border border-transparent transition-colors duration-200 data-open:border-border data-open:bg-white/2"
    >
      <SelectableRow
        id={id}
        files={files}
        label={
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faTv} className="text-xs text-text-muted" />
            {title || "Not set"}
          </span>
        }
        isSelected={isAllSelected}
        isIndeterminate={isPartiallySelected}
        onSelect={onSelect}
        trailing={
          <ExpandButton
            isOpen={isOpen}
            onToggle={() => setIsOpen((v) => !v)}
            label="episodes"
          />
        }
      >
        <Chip>
          {files.length} episode{files.length > 1 ? "s" : ""}
        </Chip>
        {seasons.length > 1 && <Chip>{seasons.length} seasons</Chip>}
        {totalSize > 0 && <Chip>{formatDataSize(totalSize)}</Chip>}
        {selectedCount > 0 && (
          <Chip color="primary">{selectedCount} selected</Chip>
        )}
        {errorCount > 0 && (
          <Chip color="danger">
            {errorCount} need{errorCount > 1 ? "" : "s"} info
          </Chip>
        )}
      </SelectableRow>

      <Collapse isOpen={isOpen}>
        <div className="px-1 pb-2 flex flex-col gap-2">
          {seasons.map(([season, seasonFiles]) => {
            const formatted = season != null ? formatNumber(season) : null;
            const key = `${id}-s${season ?? "none"}`;
            return (
              <MediaSeason
                key={key}
                id={key}
                label={formatted ? `Season ${formatted}` : "Season not set"}
                files={seasonFiles}
                onSelect={onSelect}
                onEditOne={onEditOne}
              />
            );
          })}
        </div>
      </Collapse>
    </div>
  );
}
