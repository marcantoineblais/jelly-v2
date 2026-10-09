"use client";

import { useCallback, useMemo, useState } from "react";
import type { MediaFile } from "@/src/types/MediaFile";
import type { MediaLibrary } from "@/src/types/MediaLibrary";
import { validateData } from "@/src/libs/files/validateData";
import { sortFilesByLibrary } from "@/src/libs/files/sortFilesByLibrary";
import { hasErrors } from "@/src/libs/files/getSelectionStats";
import {
  applyMediaInfoEdit,
  type MediaEditFormData,
} from "@/src/libs/files/applyMediaInfoEdit";

function prepareFiles(files: MediaFile[]): MediaFile[] {
  return files.map((file) => ({
    ...file,
    errors: validateData(file),
    isSelected: false,
  }));
}

function toIdSet(files: MediaFile | MediaFile[]) {
  return new Set((Array.isArray(files) ? files : [files]).map((f) => f.id));
}

/** State and actions for the files listed on the Transfers page. */
export default function useMediaFiles(
  initialFiles: MediaFile[],
  libraries: MediaLibrary[],
) {
  const [files, setFiles] = useState<MediaFile[]>(() =>
    prepareFiles(initialFiles),
  );

  const selectedFiles = useMemo(
    () => files.filter((file) => file.isSelected),
    [files],
  );
  const activeFiles = useMemo(
    () => files.filter((file) => !file.isIgnored),
    [files],
  );
  const incompleteFiles = useMemo(
    () => activeFiles.filter(hasErrors),
    [activeFiles],
  );
  const sortedFiles = useMemo(
    () => sortFilesByLibrary(files, libraries),
    [files, libraries],
  );
  const binnedFiles = useMemo(
    () => sortFilesByLibrary(files, libraries, true),
    [files, libraries],
  );

  const replaceFiles = useCallback((next: MediaFile[]) => {
    setFiles(prepareFiles(next));
  }, []);

  const select = useCallback(
    (selected: boolean, target: MediaFile | MediaFile[]) => {
      const ids = toIdSet(target);
      setFiles((prev) =>
        prev.map((file) =>
          ids.has(file.id) ? { ...file, isSelected: selected } : file,
        ),
      );
    },
    [],
  );

  const selectWhere = useCallback((predicate: (file: MediaFile) => boolean) => {
    setFiles((prev) =>
      prev.map((file) => ({ ...file, isSelected: predicate(file) })),
    );
  }, []);

  const clearSelection = useCallback(
    () => selectWhere(() => false),
    [selectWhere],
  );

  /** Moves the selected files to (or out of) the bin. */
  const setSelectedIgnored = useCallback((isIgnored: boolean) => {
    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isSelected: false,
        isIgnored: file.isSelected ? isIgnored : file.isIgnored,
      })),
    );
  }, []);

  const applyEditToSelected = useCallback(
    (form: MediaEditFormData) => {
      setFiles((prev) => {
        let index = 0;
        return prev.map((file) => {
          if (!file.isSelected) return file;
          const edited = {
            ...file,
            ...applyMediaInfoEdit(file, form, libraries, index++),
            isSelected: false,
          };
          return { ...edited, errors: validateData(edited) };
        });
      });
    },
    [libraries],
  );

  return {
    files,
    selectedFiles,
    activeFiles,
    incompleteFiles,
    sortedFiles,
    binnedFiles,
    replaceFiles,
    select,
    selectWhere,
    clearSelection,
    ignoreSelected: () => setSelectedIgnored(true),
    restoreSelected: () => setSelectedIgnored(false),
    applyEditToSelected,
  };
}
