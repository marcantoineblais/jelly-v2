"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { formatDataSize } from "@/src/libs/format-data-size";
import { fadeInUp } from "@/src/libs/motion";
import Progress from "./Progress";
import InfoBox from "./InfoBox";
import SectionLabel from "./SectionLabel";

type FileCopyStatusProps = {
  currentFile?: string;
  processedFiles?: number;
  totalFiles?: number;
  currentFileBytesTransferred?: number;
  totalBytesTransferred?: number;
  totalSize?: number;
};

export default function FileCopyStatus({
  currentFile = "",
  processedFiles = 0,
  totalFiles = 0,
  currentFileBytesTransferred,
  totalBytesTransferred,
  totalSize,
}: FileCopyStatusProps) {
  const transferred =
    totalBytesTransferred != null && currentFileBytesTransferred != null
      ? Math.max(0, totalBytesTransferred + currentFileBytesTransferred)
      : null;
  const progress =
    totalSize && transferred != null ? transferred / totalSize : 0;
  const percent = Math.min(100, Math.round(progress * 100));
  const isFinishing = totalFiles > 0 && processedFiles >= totalFiles;
  const fileName = currentFile.split(/[\\/]/).pop();

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        {...fadeInUp}
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
              {isFinishing ? "Finishing up…" : "Transferring files"}
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
          className="bg-linear-to-r from-primary to-primary-light"
        />

        <div className="grid grid-cols-2 gap-3">
          <InfoBox label="Transferred">
            <p className="text-sm font-medium tabular-nums text-text">
              {totalSize && transferred != null
                ? formatDataSize(transferred, { sizeRef: totalSize })
                : "—"}
            </p>
          </InfoBox>
          <InfoBox label="Total">
            <p className="text-sm font-medium tabular-nums text-text">
              {totalSize
                ? formatDataSize(totalSize, { sizeRef: totalSize })
                : "—"}
            </p>
          </InfoBox>
        </div>

        <div className="min-w-0">
          <SectionLabel className="mb-1">Current file</SectionLabel>
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
