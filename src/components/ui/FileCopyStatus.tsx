"use client";

import { Progress } from "@heroui/react";
import { formatDataSize } from "@/src/libs/format-data-size";
import H3 from "../elements/H3";

export default function FileCopyStatus({
  currentFile = "",
  processedFiles = 0,
  totalFiles = 0,
  currentFileBytesTransferred,
  currentFileSize,
  totalBytesTransferred,
  totalSize,
}: {
  isOpen?: boolean;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  currentFileBytesTransferred?: number;
  currentFileSize?: number;
  totalBytesTransferred?: number;
  totalSize?: number;
}) {
  function getProgressPercent() {
    if (!totalFiles) return 0;
    const completedFiles = processedFiles ?? 0;
    let currentFileProgress = 0;
    if (
      currentFileSize != null &&
      currentFileSize > 0 &&
      currentFileBytesTransferred != null
    ) {
      currentFileProgress = Math.min(
        1,
        currentFileBytesTransferred / currentFileSize,
      );
    }
    const overall = (completedFiles + currentFileProgress) / totalFiles;
    return Math.min(100, overall * 100);
  }

  function getHeader() {
    return `Files transferred: ${processedFiles}/${totalFiles}`;
  }

  function getProgress() {
    if (totalSize != null && totalSize > 0 && totalBytesTransferred != null) {
      const remaining = Math.max(0, totalBytesTransferred);
      return formatDataSize(remaining, { sizeRef: totalSize });
    }

    return "";
  }

  function getTotalSize() {
    if (totalSize != null && totalSize > 0) {
      return formatDataSize(totalSize, { sizeRef: totalSize });
    }

    return "";
  }

  return (
    <div className="p-4 w-full h-full flex flex-col justify-center items-center gap-8">
      <H3 className="w-full px-4 pt-3 pb-1 font-semibold text-center">{getHeader()}</H3>

      <div className="w-full px-4 pb-4">
        <div className="w-full text-nowrap text-ellipsis overflow-hidden text-default-500 mb-1">
          {currentFile || "Copying"}
        </div>

        <Progress
          aria-label="File transfer progress"
          value={getProgressPercent()}
          classNames={{ indicator: "bg-primary" }}
          size="sm"
        />

        <div className="w-full flex justify-between text-default-400 mt-1">
          <span>{getProgress()}</span>
          <span>{getTotalSize()}</span>
        </div>
      </div>
    </div>
  );
}
