"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useMemo, useState } from "react";
import { faChevronDown, faTv } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twJoin } from "tailwind-merge";
import { formatNumber } from "@/src/libs/files/formatNumber";
import { formatDataSize } from "@/src/libs/format-data-size";
import MediaCheckbox from "./MediaCheckbox";
import MediaSeason from "./MediaSeason";
import Collapse from "../ui/Collapse";
import Chip from "../ui/Chip";
import IconButton from "../ui/IconButton";

export default function MediaShow({
  id,
  title,
  files = [],
  handleSelect = () => {},
  onEditOne,
}: {
  id: string;
  title: string;
  files?: MediaFile[];
  handleSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
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

  const selectedCount = files.filter((f) => f.isSelected).length;
  const errorCount = files.filter((f) => (f.errors?.length ?? 0) > 0).length;
  const totalSize = files.reduce((sum, f) => sum + (f.size ?? 0), 0);

  return (
    <div
      data-open={isOpen || undefined}
      className="rounded-xl border border-transparent transition-colors duration-200 data-open:border-border data-open:bg-white/2"
    >
      <MediaCheckbox
        id={id}
        files={files}
        label={
          <span className="inline-flex items-center gap-2">
            <FontAwesomeIcon icon={faTv} className="text-xs text-text-muted" />
            {title || "Not set"}
          </span>
        }
        isSelected={files.length > 0 && selectedCount === files.length}
        isIndeterminate={selectedCount > 0}
        onSelect={handleSelect}
        trailing={
          <IconButton
            icon={faChevronDown}
            ariaLabel={isOpen ? "Collapse show" : "Expand show"}
            size="sm"
            onClick={() => setIsOpen((v) => !v)}
            className={twJoin(
              "size-8 rounded-lg flex items-center justify-center hover:bg-surface-hover",
              "transition-transform duration-300",
              isOpen && "rotate-180",
            )}
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
      </MediaCheckbox>

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
                handleSelect={handleSelect}
                onEditOne={onEditOne}
              />
            );
          })}
        </div>
      </Collapse>
    </div>
  );
}
