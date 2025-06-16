import { MediaFile } from "@/app/types/MediaFile";
import { Checkbox } from "@heroui/react";
import { ChangeEvent, useEffect, useState } from "react";

export default function MediaCheckbox({
  files = [],
  label = "",
  isSelected = false,
  isIndeterminate = false,
  onSelect = () => {},
}: {
  files?: MediaFile | MediaFile[];
  label?: string;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  onSelect?: (
    e: ChangeEvent<HTMLInputElement>,
    files: MediaFile | MediaFile[],
  ) => void;
}) {
  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    onSelect(e, files);
  }

  return (
    <div className="flex gap-3 items-center">
      <Checkbox
        isSelected={isSelected}
        isIndeterminate={isIndeterminate && !isSelected}
        onChange={handleSelect}
        classNames={{ wrapper: "after:bg-emerald-700" }}
      />
      <span>{label}</span>
    </div>
  );
}
