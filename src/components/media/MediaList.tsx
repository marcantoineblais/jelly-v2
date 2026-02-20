"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addToast } from "@heroui/react";
import MediaEditForm from "./MediaEditForm";
import FileSelectionBox from "../modals/FileSelectionBox";
import FileCopyStatus from "../modals/FileCopyStatus";
import { validateData } from "@/src/libs/files/validateData";
import { sortFilesByLibrary } from "@/src/libs/files/sortFilesByLibrary";
import { useFileTransferWebSocket } from "@/src/hooks/use-file-transfer-web-socket";
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
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [validatedFiles, setValidatedFiles] = useState<MediaFile[]>(
    files.map((file) => ({
      ...file,
      errors: validateData(file),
      isSelected: false,
    })),
  );
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >(new Set());

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

  const availableKeysRef = useRef<string[]>([]);

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

  const { isTransferInProgress, transferStatus, isProgressBarOpen } =
    useFileTransferWebSocket(fetchFiles);

  useEffect(() => {
    const availableKeys = [...Object.keys(sortedFiles), "bin"];
    if (availableKeys.length === 0) return;

    startTransition(() => {
      setSelectedKeys((prev) => {
        const validKeys = Array.from(prev).filter((key) =>
          availableKeys.includes(key.toString()),
        );
        return new Set(validKeys);
      });
    });
  }, [sortedFiles]);

  useEffect(() => {
    if (!showBin) return;
    const currentKeys = Object.keys(sortedFiles);
    const newKeys = currentKeys.filter(
      (key) => !availableKeysRef.current.includes(key),
    );
    availableKeysRef.current = currentKeys;
    if (newKeys.length > 0) {
      setSelectedKeys((prev) => new Set([...prev, ...newKeys]));
    }
  }, [sortedFiles, showBin]);

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
    let isBinSelected = true;
    setSelectedKeys((prev) => {
      const prevKeys = prev as Set<string | number>;
      const newKeys = keys as Set<string | number>;

      if (newKeys.has("bin") && !prevKeys.has("bin")) {
        isBinSelected = false;
        return new Set(["bin"]);
      }

      if (prevKeys.has("bin") && newKeys.size === 0) {
        isBinSelected = false;
        return new Set([]);
      }

      newKeys.delete("bin");
      return newKeys;
    });

    setShowBin((prev) => {
      if (prev !== isBinSelected) {
        setValidatedFiles((prev) =>
          prev.map((file) => ({ ...file, isSelected: false })),
        );
      }
      return isBinSelected;
    });
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
        else if (!isNaN(form.season as number))
          newMediaInfo.season = form.season;
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
    if (isTransferInProgress) {
      addToast({
        title: "Transfer already in progress",
        description: "Please wait for the current transfer to finish.",
        color: "warning",
      });
      return;
    }

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
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        addToast({
          title: "Failed to start transfer",
          description:
            data.error ||
            "The file server is busy or an error occurred. Please try again.",
          color: "danger",
        });
        return;
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: "Unexpected error",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        color: "danger",
      });
    }
  }

  if (isFilesLoading) {
    return null;
  }

  if (validatedFiles.length === 0) {
    return <MediaListEmpty isLoading={isFilesLoading} />;
  }

  return (
    <div className="px-1 py-5 h-full flex flex-col gap-3 overflow-hidden">
      <MediaListAccordion
        sortedFiles={sortedFiles}
        binnedFiles={binnedFiles}
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        onSelect={handleSelect}
      />

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
        currentFileBytesTransferred={
          transferStatus?.currentFileBytesTransferred
        }
        currentFileSize={transferStatus?.currentFileSize}
        totalBytesTransferred={transferStatus?.totalBytesTransferred}
        totalSize={transferStatus?.totalSize}
      />
    </div>
  );
}
