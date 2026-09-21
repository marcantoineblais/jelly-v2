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
import MediaEditForm from "./MediaEditForm";
import FileSelectionBox from "../ui/FileSelectionBox";
import FileCopyStatus from "../ui/FileCopyStatus";
import { validateData } from "@/src/libs/files/validateData";
import { log } from "@/src/libs/logger";
import { sortFilesByLibrary } from "@/src/libs/files/sortFilesByLibrary";
import { useFileTransferWebSocket } from "@/src/hooks/use-file-transfer-web-socket";
import MediaListEmpty from "./MediaListEmpty";
import MediaListAccordion from "./MediaListAccordion";
import useFetch from "@/src/hooks/use-fetch";
import { useToast } from "@/src/providers/ToastProvider";

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const [binSelected, setBinSelected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [validatedFiles, setValidatedFiles] = useState<MediaFile[]>(
    files.map((file) => ({
      ...file,
      errors: validateData(file),
      isSelected: false,
    })),
  );
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

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
      const { data } = await fetchData<{ files: MediaFile[] }>("/api/files", {
        headers: { "Content-Type": "application/json" },
      });
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
  }, [fetchData]);

  const { isTransferInProgress, transferStatus } =
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
    if (binSelected) return;
    const currentKeys = Object.keys(sortedFiles);
    const newKeys = currentKeys.filter(
      (key) => !availableKeysRef.current.includes(key),
    );
    availableKeysRef.current = currentKeys;
    if (newKeys.length > 0) {
      setSelectedKeys((prev) => new Set([...prev, ...newKeys]));
    }
  }, [sortedFiles, binSelected]);

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

  function handleSelectionChange(keys: Set<string>) {
    let isBinSelected = false;
    setSelectedKeys((prev) => {
      const prevKeys = prev;
      const newKeys = keys;

      if (newKeys.has("bin") && !prevKeys.has("bin")) {
        isBinSelected = true;
        newKeys.clear();
        newKeys.add("bin");
      } else if (prevKeys.has("bin") && newKeys.size === 0) {
        isBinSelected = true;
        newKeys.clear();
      } else {
        newKeys.delete("bin");
      }

      setBinSelected((prev) => {
        if (prev !== isBinSelected) {
          setValidatedFiles((prev) =>
            prev.map((file) => ({ ...file, isSelected: false })),
          );
        }
        return isBinSelected;
      });

      return newKeys;
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
    season?: number | null;
    isEpisodeEnabled?: boolean;
    episode?: number | null;
    isYearEnabled?: boolean;
    year?: number | null;
    library?: string | Set<string>;
    useOriginalName?: boolean;
    incrementEpisodes?: boolean;
  }) {
    const selectedIds = new Set(selectedFiles.map((f) => f.id));
    let counter = 0;

    setValidatedFiles((prev) =>
      prev.map((file) => {
        if (!selectedIds.has(file.id)) return file;

        const newMediaInfo = { ...file.mediaInfo };
        if (form.useOriginalName) newMediaInfo.title = file.name;
        else if (form.title) newMediaInfo.title = form.title.trim();
        if (!form.isSeasonEnabled) newMediaInfo.season = undefined;
        else if (form.season != null) newMediaInfo.season = form.season;
        if (!form.isEpisodeEnabled) newMediaInfo.episode = undefined;
        else if (form.episode != null)
          newMediaInfo.episode = form.episode + counter;
        if (!form.isYearEnabled) newMediaInfo.year = undefined;
        else if (form.year != null) newMediaInfo.year = form.year;

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
      toast.warning("Transfer already in progress");
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
      const count = incompleteFiles.length;
      toast.warning(
        `${count} file${count > 1 ? "s are" : " is"} missing information`,
      );
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
        toast.error("Failed to start transfer");
        return;
      }
    } catch (error) {
      log({
        source: "MediaList",
        message: "Unexpected save error",
        data: error,
        level: "error",
      });
      toast.error("Unexpected error");
    }
  }

  if (isTransferInProgress) {
    return (
      <FileCopyStatus
        currentFile={transferStatus?.currentFile}
        processedFiles={transferStatus?.processedFiles}
        totalFiles={transferStatus?.totalFiles}
        currentFileBytesTransferred={
          transferStatus?.currentFileBytesTransferred
        }
        totalBytesTransferred={transferStatus?.totalBytesTransferred}
        totalSize={transferStatus?.totalSize}
      />
    );
  }

  if (isFilesLoading) {
    return null;
  }

  if (validatedFiles.length === 0) {
    return <MediaListEmpty isLoading={isFilesLoading} />;
  }

  return (
    <div className="px-1 py-5 h-full flex flex-col gap-3 overflow-hidden">
      <div className="h-full overflow-hidden">
        <MediaListAccordion
          sortedFiles={sortedFiles}
          binnedFiles={binnedFiles}
          selectedItems={selectedKeys}
          setSelectedItems={handleSelectionChange}
          onSelect={handleSelect}
        />
      </div>

      <FileSelectionBox
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onSave={handleSave}
        editDisabled={selectedFiles.length === 0}
        deleteDisabled={selectedFiles.length === 0}
        restoreDisabled={selectedFiles.length === 0}
        saveDisabled={
          isTransferInProgress || Object.entries(sortedFiles).length === 0
        }
        binSelected={binSelected}
      />

      <MediaEditForm
        files={selectedFiles}
        libraries={libraries}
        isOpen={isModalOpen}
        onClose={handleClose}
        onSaveMediaInfo={handleSaveMediaInfo}
      />
    </div>
  );
}
