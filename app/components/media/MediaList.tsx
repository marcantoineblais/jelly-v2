"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { MediaLibrary } from "@/app/types/MediaLibrary";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import MediaEditForm from "./MediaEditForm";
import FileSelectionBox from "../overlay/FileSelectionBox";
import FileCopyStatus from "../FileCopyStatus";
import { validateData } from "@/app/libs/files/validateData";
import { sortFilesByLibrary } from "@/app/libs/files/sortFilesByLibrary";
import { useFileTransferWebSocket } from "@/app/hooks/useFileTransferWebSocket";
import MediaListEmpty from "./MediaListEmpty";
import MediaListAccordion from "./MediaListAccordion";

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const [showBin, setShowBin] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >("all");
  const [validatedFiles, setValidatedFiles] = useState<MediaFile[]>([]);

  const selectedFiles = useMemo(
    () => validatedFiles.filter((file) => file.isSelected),
    [validatedFiles],
  );
  const sortedFiles = useMemo(
    () => sortFilesByLibrary(validatedFiles, libraries),
    [validatedFiles, libraries],
  );
  const binnedFiles = useMemo(
    () => sortFilesByLibrary(validatedFiles, libraries, true),
    [validatedFiles, libraries],
  );

  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setIsFilesLoading(true);
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.error("Failed to fetch files");
        return;
      }
      const data = await response.json();
      setValidatedFiles(
        data.files.map((file: MediaFile) => ({
          ...file,
          errors: validateData(file),
          isSelected: false,
        })),
      );
    } finally {
      setIsFilesLoading(false);
    }
  }, []);

  const {
    isTransferInProgress,
    transferStatus,
    isProgressBarOpen,
  } = useFileTransferWebSocket(fetchFiles);

  useEffect(() => {
    setValidatedFiles(
      files.map((file) => ({
        ...file,
        errors: validateData(file),
        isSelected: false,
      })),
    );
  }, [files]);

  useEffect(() => {
    const availableKeys = Object.keys(sortedFiles);
    if (availableKeys.length === 0) return;
    setSelectedKeys((prev) => {
      const keysToKeep: (string | number)[] =
        prev === "all" ? availableKeys : Array.from(prev);
      return new Set(
        keysToKeep.filter((key) => availableKeys.includes(key.toString())),
      );
    });
  }, [sortedFiles]);

  function handleSelect(
    selected: boolean,
    updatedFiles: MediaFile | MediaFile[],
  ) {
    setValidatedFiles((prev) =>
      prev.map((file) => {
        if (Array.isArray(updatedFiles)) {
          if (updatedFiles.some((f) => f.id === file.id)) {
            return { ...file, isSelected: selected };
          }
        } else if (file.id === updatedFiles.id) {
          return { ...file, isSelected: selected };
        }
        return file;
      }),
    );
  }

  function handleSelectionChange(keys: "all" | Set<string | number>) {
    let updatedKeys =
      keys === "all" ? [...Object.keys(sortedFiles), "bin"] : Array.from(keys);
    const previousKeys =
      selectedKeys === "all"
        ? [...Object.keys(sortedFiles), "bin"]
        : Array.from(selectedKeys);

    if (updatedKeys.includes("bin") && !previousKeys.includes("bin")) {
      updatedKeys = ["bin"];
    } else if (updatedKeys.includes("bin") && previousKeys.includes("bin")) {
      updatedKeys = updatedKeys.filter((key) => key !== "bin");
    }

    setShowBin((isShowed) => {
      const binSelected = updatedKeys.includes("bin");
      if ((binSelected && isShowed) || (!isShowed && !binSelected)) {
        setValidatedFiles((prev) =>
          prev.map((file) => ({ ...file, isSelected: false })),
        );
      }
      return !binSelected;
    });
    setSelectedKeys(new Set(updatedKeys));
  }

  function handleDelete() {
    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isSelected: false,
        isIgnored: file.isSelected ? true : file.isIgnored,
      })),
    );
  }

  function handleRestore() {
    setValidatedFiles((prev) =>
      prev.map((file) => ({
        ...file,
        isSelected: false,
        isIgnored: file.isSelected ? false : file.isIgnored,
      })),
    );
  }

  function handleClose(unselectAll = false) {
    setIsModalOpen(false);
    if (unselectAll) {
      setValidatedFiles((prev) =>
        prev.map((file) => ({ ...file, isSelected: false })),
      );
    }
  }

  function handleEdit() {
    setIsModalOpen(true);
  }

  function handleSaveMediaInfo(form: {
    title?: string;
    isSeasonEnabled?: boolean;
    season?: number;
    isEpisodeEnabled?: boolean;
    episode?: number;
    isYearEnabled?: boolean;
    year?: number;
    library?: string | Set<string>;
    incrementEpisodes?: boolean;
  }) {
    const selectedIds = new Set(selectedFiles.map((f) => f.id));
    let counter = 0;

    setValidatedFiles((prev) =>
      prev.map((file) => {
        if (!selectedIds.has(file.id)) return file;

        const newMediaInfo = { ...file.mediaInfo };
        if (form.title) newMediaInfo.title = form.title.trim();
        if (!form.isSeasonEnabled) newMediaInfo.season = undefined;
        else if (!isNaN(form.season as number)) newMediaInfo.season = form.season;
        if (!form.isEpisodeEnabled) newMediaInfo.episode = undefined;
        else if (!isNaN(form.episode as number))
          newMediaInfo.episode = (form.episode as number) + counter;
        if (!form.isYearEnabled) newMediaInfo.year = undefined;
        else if (!isNaN(form.year as number)) newMediaInfo.year = form.year;

        let newLibrary = file.library;
        if (form.library && form.library !== "all") {
          const key =
            typeof form.library === "string"
              ? form.library
              : Array.from(form.library)[0];
          newLibrary =
            libraries.find((library) => library.name === key) ?? file.library;
        }

        if (form.incrementEpisodes) counter += 1;

        return {
          ...file,
          mediaInfo: newMediaInfo,
          library: newLibrary,
          errors: validateData({
            ...file,
            mediaInfo: newMediaInfo,
            library: newLibrary,
          }),
          isSelected: false,
        };
      }),
    );
    setIsModalOpen(false);
  }

  async function handleSave() {
    if (isTransferInProgress) return;

    const updatedFiles = validatedFiles.filter((file) => !file.isIgnored);
    const filesWithErrors = updatedFiles.map((file) => ({
      ...file,
      errors: validateData(file),
    }));
    const incompleteFiles = filesWithErrors.filter(
      (file) => file.errors && file.errors.length > 0,
    );
    if (incompleteFiles.length > 0) {
      console.error("Some files are missing informations.");
      return;
    }

    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updatedFiles),
      });
      const data = await response.json();
      if (data.ok) console.log("File job started");
    } catch (error) {
      console.error(error);
    }
  }

  if (validatedFiles.length === 0) {
    return <MediaListEmpty isLoading={isFilesLoading} />;
  }

  return (
    <div className="px-1 py-5 h-full max-h-full flex flex-col gap-3 overflow-hidden">
      {isFilesLoading ? (
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <Spinner size="sm" />
          <span>Refreshing list…</span>
        </div>
      ) : (
        <MediaListAccordion
          sortedFiles={sortedFiles}
          binnedFiles={binnedFiles}
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          onSelect={handleSelect}
        />
      )}

      <FileSelectionBox
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onSave={handleSave}
        disabled={selectedFiles.length === 0 || isTransferInProgress}
        saveInProgress={isProgressBarOpen}
        showBin={showBin}
      />

      <MediaEditForm
        files={selectedFiles}
        libraries={libraries}
        isOpen={isModalOpen}
        onClose={handleClose}
        onSaveMediaInfo={handleSaveMediaInfo}
      />

      <FileCopyStatus
        isOpen={isProgressBarOpen}
        currentFile={transferStatus?.currentFile}
        processedFiles={transferStatus?.processedFiles}
        totalFiles={transferStatus?.totalFiles}
      />
    </div>
  );
}
