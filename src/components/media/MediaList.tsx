"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faTrashCan,
  faTriangleExclamation,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { AnimatePresence, motion } from "framer-motion";
import { twJoin } from "tailwind-merge";
import MediaEditForm from "./MediaEditForm";
import FileSelectionBox from "../ui/FileSelectionBox";
import FileCopyStatus from "../ui/FileCopyStatus";
import { validateData } from "@/src/libs/files/validateData";
import { log } from "@/src/libs/logger";
import { sortFilesByLibrary } from "@/src/libs/files/sortFilesByLibrary";
import { formatDataSize } from "@/src/libs/format-data-size";
import { useFileTransferWebSocket } from "@/src/hooks/use-file-transfer-web-socket";
import MediaListEmpty from "./MediaListEmpty";
import MediaListAccordion from "./MediaListAccordion";
import useFetch from "@/src/hooks/use-fetch";
import { useToast } from "@/src/providers/ToastProvider";
import PageHeader from "../ui/PageHeader";
import SegmentedControl from "../ui/SegmentedControl";
import IconButton from "../ui/IconButton";
import Button from "../ui/Button";

type View = "library" | "bin";

function prepareFiles(files: MediaFile[]): MediaFile[] {
  return files.map((file) => ({
    ...file,
    errors: validateData(file),
    isSelected: false,
  }));
}

export default function MediaList({
  files = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const [view, setView] = useState<View>("library");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validatedFiles, setValidatedFiles] = useState<MediaFile[]>(() =>
    prepareFiles(files),
  );
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(),
  );
  const binSelected = view === "bin";

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
  const activeFiles = useMemo(
    () => validatedFiles.filter((file) => !file.isIgnored),
    [validatedFiles],
  );
  const binCount = validatedFiles.length - activeFiles.length;
  const filesWithErrors = useMemo(
    () => activeFiles.filter((file) => (file.errors?.length ?? 0) > 0),
    [activeFiles],
  );
  const activeSize = useMemo(
    () => activeFiles.reduce((sum, file) => sum + (file.size ?? 0), 0),
    [activeFiles],
  );

  // Open newly appearing library sections by default
  const seenKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const keys = [
      ...Object.keys(sortedFiles).map((k) => k || "not-set"),
      ...Object.keys(binnedFiles).map((k) => `bin-${k || "not-set"}`),
    ];
    const newKeys = keys.filter((key) => !seenKeysRef.current.has(key));
    if (newKeys.length === 0) return;
    newKeys.forEach((key) => seenKeysRef.current.add(key));
    setOpenSections((prev) => new Set([...prev, ...newKeys]));
  }, [sortedFiles, binnedFiles]);

  const fetchFiles = useCallback(async () => {
    setIsFilesLoading(true);
    try {
      const { data } = await fetchData<{ files: MediaFile[] }>("/api/files", {
        headers: { "Content-Type": "application/json" },
      });
      setValidatedFiles(prepareFiles(data.files));
    } finally {
      setIsFilesLoading(false);
    }
  }, [fetchData]);

  const { isTransferInProgress, transferStatus } =
    useFileTransferWebSocket(fetchFiles);

  function handleSelect(
    selected: boolean,
    updatedFiles: MediaFile | MediaFile[],
  ) {
    const ids = new Set(
      (Array.isArray(updatedFiles) ? updatedFiles : [updatedFiles]).map(
        (f) => f.id,
      ),
    );
    setValidatedFiles((prev) =>
      prev.map((file) =>
        ids.has(file.id) ? { ...file, isSelected: selected } : file,
      ),
    );
  }

  function setSelection(predicate: (file: MediaFile) => boolean) {
    setValidatedFiles((prev) =>
      prev.map((file) => ({ ...file, isSelected: predicate(file) })),
    );
  }

  function handleClearSelection() {
    setSelection(() => false);
  }

  function handleSelectAll() {
    setSelection((file) => (file.isIgnored ?? false) === binSelected);
  }

  function handleSelectIncomplete() {
    const ids = new Set(filesWithErrors.map((f) => f.id));
    setSelection((file) => ids.has(file.id));
  }

  function handleViewChange(next: View) {
    if (next === view) return;
    setView(next);
    handleClearSelection();
  }

  function handleToggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleEditOne(file: MediaFile) {
    setSelection((f) => f.id === file.id);
    setIsModalOpen(true);
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

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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

  const refreshButton = (
    <IconButton
      icon={faArrowsRotate}
      ariaLabel="Refresh files"
      onClick={fetchFiles}
      isDisabled={isFilesLoading}
      className={twJoin(
        "size-10 rounded-xl border border-border bg-surface-card flex items-center justify-center hover:bg-surface-hover",
        isFilesLoading && "[&_svg]:animate-spin",
      )}
    />
  );

  if (validatedFiles.length === 0) {
    return (
      <div className="h-full flex flex-col px-4 pt-6">
        <PageHeader title="Transfers" actions={refreshButton} />
        <MediaListEmpty
          isLoading={isFilesLoading}
          icon={faFolderOpen}
          title="No files to transfer"
          message="New downloads will show up here, ready to be renamed and moved to your libraries."
        />
      </div>
    );
  }

  const sections = binSelected ? binnedFiles : sortedFiles;
  const isViewEmpty = Object.keys(sections).length === 0;

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-6 pb-28 flex flex-col gap-4">
          <PageHeader
            title="Transfers"
            subtitle={
              activeFiles.length > 0
                ? `${activeFiles.length} file${activeFiles.length > 1 ? "s" : ""} · ${formatDataSize(activeSize)} ready to move`
                : "Everything is in the bin"
            }
            actions={refreshButton}
          />

          <div className="flex items-center justify-between gap-3">
            <SegmentedControl<View>
              value={view}
              onChange={handleViewChange}
              segments={[
                {
                  value: "library",
                  label: "To transfer",
                  badge: activeFiles.length,
                },
                {
                  value: "bin",
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                      Ignored
                    </span>
                  ),
                  badge: binCount,
                },
              ]}
            />
          </div>

          <AnimatePresence initial={false}>
            {!binSelected && filesWithErrors.length > 0 && (
              <motion.div
                key="errors-banner"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="text-warning shrink-0"
                  />
                  <p className="grow text-sm text-text-secondary">
                    <span className="font-semibold text-text">
                      {filesWithErrors.length} file
                      {filesWithErrors.length > 1 ? "s" : ""}
                    </span>{" "}
                    need{filesWithErrors.length > 1 ? "" : "s"} more info before
                    transferring.
                  </p>
                  <Button
                    size="small"
                    color="default"
                    onClick={handleSelectIncomplete}
                    className="shrink-0"
                  >
                    Select
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            data-loading={isFilesLoading || undefined}
            className="transition-opacity duration-300 data-loading:opacity-50"
          >
            {isViewEmpty ? (
              <MediaListEmpty
                icon={binSelected ? faTrashCan : faFolderOpen}
                title={binSelected ? "Nothing ignored" : "All set"}
                message={
                  binSelected
                    ? "Files you ignore will be listed here and won't be transferred."
                    : "Every file is in the bin. Restore some to transfer them."
                }
              />
            ) : (
              <MediaListAccordion
                key={view}
                sections={sections}
                keyPrefix={binSelected ? "bin-" : ""}
                openSections={openSections}
                onToggleSection={handleToggleSection}
                onSelect={handleSelect}
                onEditOne={binSelected ? undefined : handleEditOne}
              />
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 bg-linear-to-t from-background via-background/80 to-transparent">
        <div className="pointer-events-auto">
          <FileSelectionBox
            selectedCount={selectedFiles.length}
            transferCount={activeFiles.length}
            binSelected={binSelected}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onSave={handleSave}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
            isSaving={isSaving}
            saveDisabled={isTransferInProgress || activeFiles.length === 0}
          />
        </div>
      </div>

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
