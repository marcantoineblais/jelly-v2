import type { MediaFile } from "@/src/types/MediaFile";

export type SelectionStats = {
  total: number;
  selectedCount: number;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  errorCount: number;
  totalSize: number;
};

/** Aggregated selection / validation info for a group of files. */
export function getSelectionStats(files: MediaFile[]): SelectionStats {
  let selectedCount = 0;
  let errorCount = 0;
  let totalSize = 0;

  for (const file of files) {
    if (file.isSelected) selectedCount += 1;
    if ((file.errors?.length ?? 0) > 0) errorCount += 1;
    totalSize += file.size ?? 0;
  }

  return {
    total: files.length,
    selectedCount,
    isAllSelected: files.length > 0 && selectedCount === files.length,
    isPartiallySelected: selectedCount > 0 && selectedCount < files.length,
    errorCount,
    totalSize,
  };
}

export function hasErrors(file: MediaFile) {
  return (file.errors?.length ?? 0) > 0;
}
