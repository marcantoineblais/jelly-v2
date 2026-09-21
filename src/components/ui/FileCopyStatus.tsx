"use client";

import { formatDataSize } from "@/src/libs/format-data-size";
import H3 from "../elements/H3";
import Progress from "./Progress";

export default function FileCopyStatus({
  currentFile = "",
  processedFiles = 0,
  totalFiles = 0,
  currentFileBytesTransferred,
  totalBytesTransferred,
  totalSize,
}: {
  isOpen?: boolean;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  currentFileBytesTransferred?: number;
  totalBytesTransferred?: number;
  totalSize?: number;
}) {
  function getProgressPercent() {
    if (
      !totalSize ||
      totalBytesTransferred == null ||
      currentFileBytesTransferred == null
    )
      return 0;
    const overall =
      (totalBytesTransferred + currentFileBytesTransferred) / totalSize;
    return overall;
  }

  function getHeader() {
    return `Files transferred: ${processedFiles}/${totalFiles}`;
  }

  function getProgress() {
    if (
      totalSize == null ||
      totalSize === 0 ||
      totalBytesTransferred == null ||
      currentFileBytesTransferred == null
    ) {
      return "";
    }

    const remaining = Math.max(
      0,
      totalBytesTransferred + currentFileBytesTransferred,
    );
    return formatDataSize(remaining, { sizeRef: totalSize });
  }

  function getTotalSize() {
    if (totalSize != null && totalSize > 0) {
      return formatDataSize(totalSize, { sizeRef: totalSize });
    }

    return "";
  }

  return (
    <div className="p-4 w-full h-full flex flex-col justify-center items-center gap-8">
      <H3 className="w-full px-4 pt-3 pb-1 font-semibold text-center">
        {getHeader()}
      </H3>

      <div className="w-full px-4 pb-4">
        <div className="w-full text-nowrap text-ellipsis overflow-hidden text-default-500 mb-1">
          {currentFile || "Copying"}
        </div>

        <Progress value={getProgressPercent()} />

        <div className="w-full flex justify-between text-default-400 mt-1">
          <span>{getProgress()}</span>
          <span>{getTotalSize()}</span>
        </div>
      </div>
    </div>
  );
}
