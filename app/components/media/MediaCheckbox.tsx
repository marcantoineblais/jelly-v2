"use client";

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
    files: MediaFile | MediaFile[]
  ) => void;
}) {
  const [displayedLabel, setDisplayedLabel] = useState<string>(label);
  const [errors, setErrors] = useState<boolean>(false);

  useEffect(() => {
    if (Array.isArray(files)) {
      setErrors(files.some((file) => file.errors && file.errors.length > 0));
    } else {
      setErrors(files.errors !== undefined && files.errors.length > 0);
    }
  }, [files]);

  useEffect(() => {
    if (label.length > 35) {
      setDisplayedLabel(label.slice(0, 32) + "...");
    } else {
      setDisplayedLabel(label);
    }
  }, [label])

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    onSelect(e, files);
  }

  return (
    <div className="flex gap-3 items-center overflow-hidden">
      <Checkbox
        isSelected={isSelected}
        isIndeterminate={isIndeterminate && !isSelected}
        onChange={handleSelect}
        classNames={{ wrapper: "after:bg-emerald-700" }}
      />
      <div
        className="flex flex-col data-error:text-red-800 text-nowrap"
        data-error={errors || undefined}
      >
        {displayedLabel}

        {errors && !Array.isArray(files) && (
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
