"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { formatDataSize } from "@/src/libs/format-data-size";
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
  const hasBytes =
    !!totalSize &&
    totalBytesTransferred != null &&
    currentFileBytesTransferred != null;

  const transferred = hasBytes
    ? Math.max(0, totalBytesTransferred! + currentFileBytesTransferred!)
    : 0;
  const progress = hasBytes ? transferred / totalSize! : 0;
  const percent = Math.min(100, Math.round(progress * 100));
  const isDone = totalFiles > 0 && processedFiles >= totalFiles;

  const fileName = currentFile ? currentFile.split(/[\\/]/).pop() : "";

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card w-full max-w-lg p-6 flex flex-col gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative size-12 shrink-0">
            <span className="absolute inset-0 rounded-2xl bg-primary/25 animate-ping [animation-duration:2s]" />
            <span className="relative size-12 rounded-2xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faArrowRightArrowLeft}
                className="text-primary"
              />
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text">
              {isDone ? "Finishing up…" : "Transferring files"}
            </h2>
            <p className="text-sm text-text-muted">
              Keep this page open or come back later.
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <span className="text-5xl font-bold tracking-tight tabular-nums text-text">
            {percent}
            <span className="text-2xl text-text-muted">%</span>
          </span>
          <span className="pb-1.5 text-sm text-text-secondary tabular-nums">
            {processedFiles} / {totalFiles} files
          </span>
        </div>

        <Progress
          value={progress}
          isAnimated
          trackClassName="h-2.5"
          className="bg-linear-to-r from-emerald-500 to-teal-300"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface/60 border border-border px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-text-muted">
              Transferred
            </div>
            <div className="text-sm font-medium tabular-nums text-text">
              {hasBytes
                ? formatDataSize(transferred, { sizeRef: totalSize })
                : "—"}
            </div>
          </div>
          <div className="rounded-xl bg-surface/60 border border-border px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-text-muted">
              Total
            </div>
            <div className="text-sm font-medium tabular-nums text-text">
              {totalSize
                ? formatDataSize(totalSize, { sizeRef: totalSize })
                : "—"}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-text-muted mb-1">
            Current file
          </div>
          <p
            className="font-mono text-xs text-text-secondary truncate"
            title={currentFile}
          >
            {fileName || "Preparing…"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
