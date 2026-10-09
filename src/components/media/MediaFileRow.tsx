"use client";

import { useState } from "react";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MediaFile } from "@/src/types/MediaFile";
import { formatDataSize } from "@/src/libs/format-data-size";
import { createEpisodeLabel } from "@/src/libs/files/createFilename";
import SelectableRow from "./SelectableRow";
import SingleMedia from "./SingleMedia";
import Collapse from "../ui/Collapse";
import Chip from "../ui/Chip";
import ExpandButton from "../ui/ExpandButton";
import Button from "../ui/Button";

type MediaFileRowProps = {
  file: MediaFile;
  label: string;
  variant: "movie" | "episode";
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
  onEditOne?: (file: MediaFile) => void;
};

export default function MediaFileRow({
  file,
  label,
  variant,
  onSelect,
  onEditOne,
}: MediaFileRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const errors = file.errors ?? [];

  return (
    <div
      data-open={isOpen || undefined}
      className="rounded-xl transition-colors duration-200 data-open:bg-white/2"
    >
      <SelectableRow
        id={file.id.toString()}
        files={file}
        label={label}
        isSelected={file.isSelected}
        onSelect={onSelect}
        trailing={
          <ExpandButton
            isOpen={isOpen}
            onToggle={() => setIsOpen((v) => !v)}
            label="details"
          />
        }
      >
        {variant === "episode" && (
          <Chip mono color="primary">
            {createEpisodeLabel(file.mediaInfo)}
          </Chip>
        )}
        {variant === "movie" && file.mediaInfo.year && (
          <Chip mono>{file.mediaInfo.year}</Chip>
        )}
        {file.size != null && <Chip>{formatDataSize(file.size)}</Chip>}
        {file.ext && <Chip mono>{file.ext.replace(".", "")}</Chip>}
        {errors.map((error) => (
          <Chip key={error} color="danger">
            {error}
          </Chip>
        ))}
      </SelectableRow>

      <Collapse isOpen={isOpen}>
        <div className="px-3 pb-3 pt-1 ml-8 flex flex-col gap-3">
          <SingleMedia file={file} />
          {onEditOne && (
            <div>
              <Button
                size="small"
                color="default"
                onClick={() => onEditOne(file)}
              >
                <FontAwesomeIcon
                  icon={faPen}
                  className="text-xs text-text-muted"
                />
                Edit this file
              </Button>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
}
