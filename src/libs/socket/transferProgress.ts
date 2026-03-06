import { WebSocket } from "ws";
import type { TransferError } from "@/src/libs/files/processFiles";

export interface ProgressPayload {
  currentFile: string;
  processedFiles: number;
  totalFiles: number;
  currentFileBytesTransferred?: number;
  currentFileSize?: number;
  totalBytesTransferred: number;
  totalSize: number;
  errors: TransferError[];
  isCompleted?: boolean;
}

export interface FileProgress {
  processedFiles: number;
  totalFiles: number;
  currentFile: string;
  totalBytesTransferred: number;
  totalSize: number;
}

export function sendProgress({
  ws,
  payload,
}: {
  ws: WebSocket;
  payload: ProgressPayload;
}): void {
  try {
    ws.send(JSON.stringify(payload));
  } catch {}
}

export function sendTransferStarted({
  ws,
  totalFiles,
  totalSize,
  errors,
}: {
  ws: WebSocket;
  totalFiles: number;
  totalSize: number;
  errors: TransferError[];
}): void {
  try {
    ws.send(
      JSON.stringify({
        currentFile: "Process started",
        processedFiles: 0,
        totalFiles,
        totalBytesTransferred: 0,
        totalSize,
        errors,
      }),
    );
  } catch {}
}

export function sendTransferCompleted({
  ws,
  totalFiles,
  errors,
}: {
  ws: WebSocket;
  totalFiles: number;
  errors: TransferError[];
}): void {
  try {
    ws.send(
      JSON.stringify({
        currentFile: "Files transfer completed",
        processedFiles: totalFiles,
        totalFiles,
        isCompleted: true,
        errors,
      }),
    );
  } catch {}
}
