"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faFolderOpen,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { twJoin } from "tailwind-merge";
import { log } from "@/src/libs/logger";
import { formatDataSize } from "@/src/libs/format-data-size";
import { getSelectionStats } from "@/src/libs/files/getSelectionStats";
import type { MediaEditFormData } from "@/src/libs/files/applyMediaInfoEdit";
import { useFileTransferWebSocket } from "@/src/hooks/use-file-transfer-web-socket";
import useMediaFiles from "@/src/hooks/use-media-files";
import useFetch from "@/src/hooks/use-fetch";
import { useToast } from "@/src/providers/ToastProvider";
import MediaEditForm from "./MediaEditForm";
import MediaListEmpty from "./MediaListEmpty";
import LibrarySectionList, { getSectionKey } from "./LibrarySectionList";
import TransferActionBar from "./TransferActionBar";
import IncompleteFilesBanner from "./IncompleteFilesBanner";
import FileCopyStatus from "../ui/FileCopyStatus";
import PageHeader from "../ui/PageHeader";
import SegmentedControl from "../ui/SegmentedControl";
import IconButton from "../ui/IconButton";

type View = "library" | "bin";

const BIN_KEY_PREFIX = "bin-";

export default function MediaList({
  files: initialFiles = [],
  libraries = [],
}: {
  files: MediaFile[];
  libraries: MediaLibrary[];
}) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const {
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
    ignoreSelected,
    restoreSelected,
    applyEditToSelected,
  } = useMediaFiles(initialFiles, libraries);

  const [view, setView] = useState<View>("library");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isStartingTransfer, setIsStartingTransfer] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(),
  );
  const isBinView = view === "bin";
  const ignoredCount = files.length - activeFiles.length;
  const activeSize = getSelectionStats(activeFiles).totalSize;

  // Open newly appearing library sections by default
  const seenSectionsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const keys = [
      ...Object.keys(sortedFiles).map((name) => getSectionKey(name)),
      ...Object.keys(binnedFiles).map((name) =>
        getSectionKey(name, BIN_KEY_PREFIX),
      ),
    ];
    const newKeys = keys.filter((key) => !seenSectionsRef.current.has(key));
    if (newKeys.length === 0) return;
    newKeys.forEach((key) => seenSectionsRef.current.add(key));
    setOpenSections((prev) => new Set([...prev, ...newKeys]));
  }, [sortedFiles, binnedFiles]);

  const fetchFiles = useCallback(async () => {
    setIsFilesLoading(true);
    try {
      const { data } = await fetchData<{ files: MediaFile[] }>("/api/files", {
        headers: { "Content-Type": "application/json" },
      });
      replaceFiles(data.files);
    } finally {
      setIsFilesLoading(false);
    }
  }, [fetchData, replaceFiles]);

  const { isTransferInProgress, transferStatus } =
    useFileTransferWebSocket(fetchFiles);

  function handleViewChange(next: View) {
    if (next === view) return;
    setView(next);
    clearSelection();
  }

  function handleToggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSelectAll() {
    selectWhere((file) => (file.isIgnored ?? false) === isBinView);
  }

  function handleSelectIncomplete() {
    const ids = new Set(incompleteFiles.map((file) => file.id));
    selectWhere((file) => ids.has(file.id));
  }

  function handleEditOne(file: MediaFile) {
    selectWhere((candidate) => candidate.id === file.id);
    setIsEditOpen(true);
  }

  function handleSaveEdit(form: MediaEditFormData) {
    applyEditToSelected(form);
    setIsEditOpen(false);
  }

  async function handleTransfer() {
    if (isTransferInProgress) {
      toast.warning("Transfer already in progress");
      return;
    }

    if (incompleteFiles.length > 0) {
      const count = incompleteFiles.length;
      toast.warning(
        `${count} file${count > 1 ? "s are" : " is"} missing information`,
      );
      return;
    }

    setIsStartingTransfer(true);
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(activeFiles),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !data.ok) {
        toast.error("Failed to start transfer");
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
      setIsStartingTransfer(false);
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

  if (files.length === 0) {
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

  const sections = isBinView ? binnedFiles : sortedFiles;
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

          <div>
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
                  badge: ignoredCount,
                },
              ]}
            />
          </div>

          {!isBinView && (
            <IncompleteFilesBanner
              count={incompleteFiles.length}
              onSelect={handleSelectIncomplete}
            />
          )}

          <div
            data-loading={isFilesLoading || undefined}
            className="transition-opacity duration-300 data-loading:opacity-50"
          >
            {isViewEmpty ? (
              <MediaListEmpty
                icon={isBinView ? faTrashCan : faFolderOpen}
                title={isBinView ? "Nothing ignored" : "All set"}
                message={
                  isBinView
                    ? "Files you ignore will be listed here and won't be transferred."
                    : "Every file is in the bin. Restore some to transfer them."
                }
              />
            ) : (
              <LibrarySectionList
                key={view}
                sections={sections}
                keyPrefix={isBinView ? BIN_KEY_PREFIX : ""}
                openSections={openSections}
                onToggleSection={handleToggleSection}
                onSelect={select}
                onEditOne={isBinView ? undefined : handleEditOne}
              />
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 bg-linear-to-t from-background via-background/80 to-transparent">
        <div className="pointer-events-auto">
          <TransferActionBar
            selectedCount={selectedFiles.length}
            transferCount={activeFiles.length}
            isBinView={isBinView}
            onEdit={() => setIsEditOpen(true)}
            onIgnore={ignoreSelected}
            onRestore={restoreSelected}
            onTransfer={handleTransfer}
            onClearSelection={clearSelection}
            onSelectAll={handleSelectAll}
            isTransferring={isStartingTransfer}
            isTransferDisabled={activeFiles.length === 0}
          />
        </div>
      </div>

      <MediaEditForm
        files={selectedFiles}
        libraries={libraries}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
