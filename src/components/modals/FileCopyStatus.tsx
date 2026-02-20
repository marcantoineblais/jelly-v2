"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Progress,
} from "@heroui/react";
import { formatDataSize } from "@/src/libs/format-data-size";

export default function FileCopyStatus({
  isOpen = false,
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
    return `Files processed: ${processedFiles} / ${totalFiles}`;
  }

  function getProgress() {
    if (totalSize != null && totalSize > 0 && totalBytesTransferred != null) {
      const remaining = Math.max(0, totalSize - totalBytesTransferred);
      const formattedBytes = formatDataSize(remaining, { sizeRef: totalSize });
      return `${formattedBytes} remaining`;
    }

    return "";
  }

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent className="overflow-hidden">
        <ModalHeader>{getHeader()}</ModalHeader>

        <ModalBody className="overflow-hidden">
          <div className="w-full pb-8 overflow-hidden">
            <div className="w-full text-nowrap text-ellipsis overflow-hidden">
              {currentFile || "Copying"}
            </div>

            <Progress
              value={getProgressPercent()}
              classNames={{ indicator: "bg-primary" }}
            />

            <div className="w-full flex justify-center">{getProgress()}</div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
