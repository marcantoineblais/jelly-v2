"use client";

import { addToast } from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "../providers/config-provider-client";

export interface TransferStatus {
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  currentFileBytesTransferred?: number;
  currentFileSize?: number;
  totalBytesTransferred?: number;
  totalSize?: number;
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

  const fetchFiles = useCallback(async () => {
    if (onFilesRefreshed) await onFilesRefreshed();
  }, [onFilesRefreshed]);

  useEffect(() => {
    if (!socketServerUrl) {
      console.error("SOCKET_SERVER_URL is not set");
      return;
    }

    function connect() {
      // Always reset the WebSocket when (re)connecting
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }

      const ws = new window.WebSocket(socketServerUrl);
      wsRef.current = ws;

      ws.onmessage = async (e: MessageEvent) => {
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

            const transferErrors = data.errors as Array<{ file?: { path?: string; name?: string }; message: string }> | undefined;
            if (Array.isArray(transferErrors) && transferErrors.length > 0) {
              const description =
                transferErrors.length === 1
                  ? transferErrors[0].message
                  : `${transferErrors.length} file(s) had errors. First: ${transferErrors[0].message}`;
              addToast({
                title: "Transfer completed with errors",
                description,
                severity: "warning",
              });
            }
          }

          if (data.totalFiles && data.processedFiles !== undefined) {
            setTransferStatus({
              currentFile: data.currentFile,
              processedFiles: data.processedFiles,
              totalFiles: data.totalFiles,
              currentFileBytesTransferred: data.currentFileBytesTransferred,
              currentFileSize: data.currentFileSize,
              totalBytesTransferred: data.totalBytesTransferred,
              totalSize: data.totalSize,
            });
            setIsTransferInProgress(true);
            setIsProgressBarOpen(true);
          }
        } catch {
          await fetchFiles();
        }
      };

      ws.onclose = () => {
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
    }

    connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [fetchFiles, socketServerUrl]);

  return {
    isTransferInProgress,
    transferStatus,
    isProgressBarOpen,
    fetchFiles,
  };
}
