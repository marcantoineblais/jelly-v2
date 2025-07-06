"use client";

import { Modal, ModalBody, ModalContent, Progress } from "@heroui/react";

export default function FileCopyStatus({
  isOpen = false,
  currentFile = "",
  processedFiles = 0,
  totalFiles = 0,
}: {
  isOpen?: boolean;
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
}) {
  return (
    <Modal
      isOpen={isOpen}
      placement="center"
      hideCloseButton
      isDismissable={false}
    >
      <ModalContent>
        <ModalBody>
          <Progress
            label={currentFile || "Copying files"}
            value={totalFiles ? (processedFiles / totalFiles) * 100 : 0}
            classNames={{ indicator: "bg-emerald-700" }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
