"use client";

import { addToast } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "./use-config";

export interface TransferStatus {
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  currentFileBytesTransferred?: number;
  currentFileSize?: number;
}

export function useFileTransferWebSocket(
  onFilesRefreshed?: () => Promise<void>,
) {
  const { socketServerUrl } = useConfig();
  const [isTransferInProgress, setIsTransferInProgress] = useState(false);
  const [transferStatus, setTransferStatus] = useState<TransferStatus | null>(
    null,
  );
  const [isProgressBarOpen, setIsProgressBarOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsCleanupRef = useRef<(() => void) | null>(null);

  const fetchFiles = useCallback(async () => {
    if (onFilesRefreshed) await onFilesRefreshed();
  }, [onFilesRefreshed]);

  useEffect(() => {
    if (!socketServerUrl) {
      console.error("SOCKET_SERVER_URL is not set");
      return;
    }

    function connect() {
      wsCleanupRef.current?.();
      const ws = new window.WebSocket(socketServerUrl!);
      wsRef.current = ws;

      const onMessage = async (e: MessageEvent) => {
        try {
          const json =
            typeof e.data === "string" ? e.data : await e.data.text();
          const data = JSON.parse(json);
          if (data.isCompleted || data.error) {
            setTimeout(async () => {
              setIsProgressBarOpen(false);
              setIsTransferInProgress(false);
              setTransferStatus(null);
              await fetchFiles();
            }, 2000);

            if (data.error) {
              addToast({
                title: "File transfer failed",
                description: "There was an issue during file transfer.",
                severity: "danger",
              });
              return;
            }
          }

          if (data.totalFiles && data.processedFiles !== undefined) {
            setTransferStatus({
              currentFile: data.currentFile,
              processedFiles: data.processedFiles,
              totalFiles: data.totalFiles,
              currentFileBytesTransferred: data.currentFileBytesTransferred,
              currentFileSize: data.currentFileSize,
            });
            setIsTransferInProgress(true);
            setIsProgressBarOpen(true);
          }
        } catch {
          fetchFiles();
        }
      };

      const onClose = () => {
        setIsTransferInProgress((prev) => {
          if (prev) {
            setIsProgressBarOpen(false);
            setTransferStatus(null);
            fetchFiles();
            return false;
          }
          return prev;
        });
      };

      ws.addEventListener("message", onMessage);
      ws.addEventListener("close", onClose);

      const cleanup = () => {
        ws.removeEventListener("message", onMessage);
        ws.removeEventListener("close", onClose);
        ws.close();
        wsRef.current = null;
      };
      wsCleanupRef.current = cleanup;
    }

    connect();

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      ) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wsCleanupRef.current?.();
    };
  }, [fetchFiles]);

  return {
    isTransferInProgress,
    transferStatus,
    isProgressBarOpen,
    fetchFiles,
  };
}
