import { MediaFile } from "@/app/types/MediaFile";
import { Checkbox } from "@heroui/react";
import { ChangeEvent, useEffect, useState } from "react";

const MediaCheckbox = ({
  files,
  label = "",
  isSelected = false,
  isIndeterminate = false,
  onSelect = () => {},
}: {
  files: MediaFile[];
  label?: string;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  onSelect?: (e: ChangeEvent<HTMLInputElement>, files: MediaFile[]) => void;
}) => {
  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    onSelect(e, files);
  }

  return (
    <div className="flex gap-3 items-center">
      <Checkbox
        isSelected={isSelected}
        isIndeterminate={isIndeterminate && !isSelected}
        onChange={handleSelect}
      />
      <span>{label}</span>
    </div>
  );
};

export default MediaCheckbox;
