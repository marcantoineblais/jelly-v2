"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { Checkbox } from "@heroui/react";
import { ChangeEvent, useMemo } from "react";

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

  const hasError = useMemo(() => {
    if (Array.isArray(files)) {
      return files.some((file) => file.errors && file.errors.length > 0);
    } else {
      return files.errors !== undefined && files.errors.length > 0;
    }
  }, [files]);

  return (
    <div className="flex gap-3 items-center">
      <Checkbox
        isSelected={isSelected}
        isIndeterminate={isIndeterminate && !isSelected}
        onChange={handleSelect}
        classNames={{ wrapper: "after:bg-emerald-700" }}
      />
      <div
        className="w-full data-error:text-red-800 overflow-hidden"
        data-error={hasError || undefined}
      >
        <span className="block w-full truncate">{label}</span>

        {hasError && !Array.isArray(files) && (
          <ul className="text-xs text-red-800">
            {files.errors?.map((error, i) => (
              <li key={i}>*{error}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
