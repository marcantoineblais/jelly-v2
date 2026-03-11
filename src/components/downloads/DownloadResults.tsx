"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  addToast,
  useDisclosure,
} from "@heroui/react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { TorrentPreviewResponse } from "@/src/app/api/qbit/torrents/preview/route";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { POLL_INTERVAL_MS } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";
import TorrentFileTree from "@/src/components/torrent-file-tree/FileTree";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

// Tracks what to do with a torrent when its metadata arrives.
// "resume" — user clicked Download before metadata was ready.
// "cancel" — user closed the modal (or opened another torrent) before metadata.
// "ignore" — torrent already existed in qBit; never delete it.
type TorrentAction = "resume" | "cancel" | "ignore";

type DownloadResultsProps = {
  items: FeedItem[];
  hasSearched: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
};

export default function DownloadResults({
  items,
  hasSearched,
  emptyTitle = "No torrents found",
  emptyMessage = "Change your search criteria and try again.",
}: DownloadResultsProps) {
  const { fetchData } = useFetch();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [files, setFiles] = useState<QbitTorrentFile[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Hash of the torrent currently shown in the modal (null when unknown).
  const pendingHashRef = useRef<string | null>(null);
  // Maps torrent hash → deferred action. The preview promise consults this
  // when it resolves to decide whether to resume, cancel or ignore.
  const torrentActionsRef = useRef<Record<string, TorrentAction>>({});
  // Polling interval id for the file list.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── qBit helpers ──────────────────────────────────────────────────────

  async function resumeTorrent(hash: string) {
    try {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
        silent: true,
      });
    } catch { /* non-critical */ }
  }

  async function pauseTorrent(hash: string) {
    try {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
        silent: true,
      });
    } catch { /* non-critical */ }
  }

  async function deleteTorrent(hash: string) {
    try {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "DELETE",
        silent: true,
      });
    } catch { /* non-critical */ }
  }

  // ── Polling ───────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPollingFiles = useCallback(
    (hash: string) => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const { data } = await fetchData<HashFilesResponse>(
            `/api/qbit/torrents/${hash}`,
            { silent: true },
          );
          if (data.files && data.files.length > 0) {
            stopPolling();
            setFiles(data.files);
            await pauseTorrent(hash);
          }
        } catch {
          // Keep retrying — transient errors are expected while metadata loads
        }
      }, POLL_INTERVAL_MS);
    },
    [fetchData, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Modal state ───────────────────────────────────────────────────────

  function resetModalState() {
    setSelectedItem(null);
    setFiles([]);
    setIsStarting(false);
    pendingHashRef.current = null;
  }

  function closeModal() {
    // Empty string (not null) so stale preview promises for non-magnet links
    // can distinguish "modal closed" from "waiting for hash".
    pendingHashRef.current = "";
    onModalClose();
    setTimeout(resetModalState, 200);
  }

  // ── Preview loading ───────────────────────────────────────────────────

  function executeDeferredAction(hash: string, alreadyExists: boolean) {
    const action = torrentActionsRef.current[hash];
    if (!action) return false;

    delete torrentActionsRef.current[hash];
    if (action === "resume") resumeTorrent(hash);
    else if (action === "cancel" && !alreadyExists) deleteTorrent(hash);
    return true;
  }

  function isStalePreview(myHash: string | null, hash: string) {
    return pendingHashRef.current !== myHash && pendingHashRef.current !== hash;
  }

  function applyPreview(hash: string, data: TorrentPreviewResponse) {
    pendingHashRef.current = hash;
    if (data.alreadyExists) {
      torrentActionsRef.current[hash] = "ignore";
    }

    if (data.files && data.files.length > 0) {
      setFiles(data.files);
      if (!data.alreadyExists) pauseTorrent(hash);
    } else {
      startPollingFiles(hash);
    }
  }

  async function loadPreview(item: FeedItem, myHash: string | null) {
    try {
      const { data } = await fetchData<TorrentPreviewResponse>(
        "/api/qbit/torrents/preview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
          silent: true,
        },
      );

      const hash = data.hash;
      if (!hash) return;

      if (executeDeferredAction(hash, data.alreadyExists ?? false)) return;

      if (isStalePreview(myHash, hash)) {
        if (!data.alreadyExists) deleteTorrent(hash);
        return;
      }

      applyPreview(hash, data);
    } catch (err) {
      if (isStalePreview(myHash, myHash ?? "")) return;
      addToast({
        title: "Preview failed",
        description:
          err instanceof Error ? err.message : "Could not add torrent",
        severity: "danger",
      });
    }
  }

  // ── Event handlers ────────────────────────────────────────────────────

  function handleSelectItem(item: FeedItem) {
    const prevHash = pendingHashRef.current;
    if (prevHash && torrentActionsRef.current[prevHash] !== "ignore") {
      torrentActionsRef.current[prevHash] = "cancel";
    }
    stopPolling();

    setSelectedItem(item);
    setFiles([]);

    // For magnet links the infohash is in the URL — set it immediately so
    // the Download button works without waiting for the server round-trip.
    const magnetMatch = item.url.match(/urn:btih:([a-fA-F0-9]{40})/i);
    const myHash = magnetMatch ? magnetMatch[1].toLowerCase() : null;
    pendingHashRef.current = myHash;

    onModalOpen();
    loadPreview(item, myHash);
  }

  function handleCloseModal() {
    const hash = pendingHashRef.current;
    stopPolling();

    if (hash) {
      const action = torrentActionsRef.current[hash];
      if (action === "ignore") {
        delete torrentActionsRef.current[hash];
      } else if (files.length > 0) {
        delete torrentActionsRef.current[hash];
        deleteTorrent(hash);
      } else {
        torrentActionsRef.current[hash] = "cancel";
      }
    }

    closeModal();
  }

  async function handleDownload() {
    const hash = pendingHashRef.current;
    stopPolling();

    try {
      setIsStarting(true);
      if (hash) {
        torrentActionsRef.current[hash] = "resume";
        await fetchData(`/api/qbit/torrents/${hash}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
      } else {
        await fetchData("/api/qbit/torrents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: selectedItem?.url }),
        });
      }
      addToast({
        title: "Downloading",
        description: selectedItem?.title,
        severity: "success",
      });
    } catch {
      /* useFetch shows error toast */
    } finally {
      setIsStarting(false);
    }

    closeModal();
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <>
      {hasSearched && items.length === 0 && (
        <div className="flex w-full grow justify-center items-center">
          <MediaListEmpty title={emptyTitle} message={emptyMessage} />
        </div>
      )}

      {hasSearched && items.length > 0 && (
        <Table items={items}>
          {(item) => (
            <TableItem
              key={item.id}
              item={item}
              onClick={() => handleSelectItem(item)}
            />
          )}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onOpenChange={onModalOpenChange}
        placement="center"
        scrollBehavior="inside"
        onClose={handleCloseModal}
      >
        {selectedItem && (
          <ModalContent>
            <ModalHeader>Metadata</ModalHeader>

            <ModalBody className="flex flex-col gap-2">
              <p className="break-all">{selectedItem?.title}</p>
              {files.length === 0 ? (
                <div className="w-full flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-start">Files:</p>
                  <TorrentFileTree files={files} />
                </>
              )}
            </ModalBody>

            <ModalFooter className="flex justify-center gap-2">
              <Button
                className="w-32"
                color="default"
                variant="ghost"
                onPress={handleCloseModal}
              >
                Cancel
              </Button>
              <Button
                className="w-32"
                color="primary"
                variant="solid"
                onPress={handleDownload}
                isLoading={isStarting}
              >
                Download
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </>
  );
}
