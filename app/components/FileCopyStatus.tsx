"use client";

import { Modal, ModalBody, ModalContent, Progress } from "@heroui/react";
import { useEffect, useState } from "react";
import { MediaFile } from "../types/MediaFile";

export default function FileCopyStatus({
  isOpen = false,
  onClose = () => {},
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [currentFile, setCurrentFile] = useState<string>("");
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [processedFiles, setProcessedFiles] = useState<number>(0);
  const [errors, setErrors] = useState<{ file: MediaFile; message: string }[]>(
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    const socket = new WebSocket(`ws://localhost:3000/api/save`);
    socket.addEventListener("open", () => {
      socket.addEventListener("message", async (e) => {
        const payload =
          typeof e.data === "string" ? e.data : await e.data.text();
        const data = JSON.parse(payload);
        setCurrentFile(data.currentFile);
        setTotalFiles(data.totalFiles);
        setProcessedFiles(data.processedFiles);
        setErrors(data.errors);
      });
    });

    return () => {
      socket.close();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (processedFiles === totalFiles && totalFiles !== 0) {
      setTimeout(onClose, 2000);
    }    
  }, [isOpen, processedFiles, totalFiles, onClose]);

  return (
    <Modal isOpen={isOpen} placement="center" hideCloseButton isDismissable={false}>
      <ModalContent>
        <ModalBody>
          <Progress
            label={currentFile || "Copying files"}
            value={(processedFiles / totalFiles) * 100}
            classNames={{indicator: "bg-emerald-700"}}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
