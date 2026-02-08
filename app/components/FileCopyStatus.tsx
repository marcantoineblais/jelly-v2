"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Progress,
} from "@heroui/react";

export default function FileCopyStatus({
  isOpen = false,
  currentFile = "",
  processedFiles = 0,
  totalFiles = 0,
  currentFileBytesTransferred,
  currentFileSize,
}: {
  isOpen?: boolean;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  currentFileBytesTransferred?: number;
  currentFileSize?: number;
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

  function getLabel() {
    if (
      currentFileSize != null &&
      currentFileSize > 0 &&
      currentFileBytesTransferred != null
    ) {
      return `${formatBytes(currentFileBytesTransferred)} / ${formatBytes(currentFileSize)}`;
    }

    return "";
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent>
        <ModalHeader>{getHeader()}</ModalHeader>

        <ModalBody>
          <div className="w-full pb-12 overflow-hidden">
            <div className="w-full max-w-full text-nowrap text-ellipsis overflow-hidden">
              {currentFile || "Copying"}
            </div>

            <Progress
              value={getProgressPercent()}
              classNames={{ indicator: "bg-emerald-700" }}
            />

            <div className="w-full flex justify-center">{getLabel()}</div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
