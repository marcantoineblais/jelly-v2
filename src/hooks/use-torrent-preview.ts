import { useCallback, useEffect, useRef, useState } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { TorrentPreviewResponse } from "@/src/app/api/qbit/torrents/preview/route";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { POLL_INTERVAL_MS } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

// Tracks what to do with a torrent, keyed by URL.
// action:
//   "ignore" — default; we don't know what the user wants yet.
//   "start"  — user clicked Download before metadata arrived; start when hash resolves.
//   "delete" — user cancelled / switched torrent before metadata arrived; delete when hash resolves.
// alreadyExists: set to true by loadPreview when the torrent was already in qBit.
type TorrentEntry = {
  action: "ignore" | "start" | "delete";
  hash: string;
  alreadyExists: boolean;
};

export default function useTorrentPreview() {
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

  // URL → entry. Lives for the entire lifecycle of a preview, from selectTorrent
  // until the user takes a final action (download/cancel) or switches torrents.
  const torrentEntriesRef = useRef<Record<string, TorrentEntry>>({});
  // Polling interval id for the file list.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── qBit helpers ──────────────────────────────────────────────────────

  const resumeTorrent = useCallback(
    async (hash: string) => {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
        silent: true,
      });
    },
    [fetchData],
  );

  const pauseTorrent = useCallback(
    async (hash: string) => {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
        silent: true,
      });
    },
    [fetchData],
  );

  const deleteTorrent = useCallback(
    async (hash: string) => {
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "DELETE",
        silent: true,
      });
    },
    [fetchData],
  );

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
            try {
              await pauseTorrent(hash);
            } catch {
              /* non-critical — torrent stays active until user decides */
            }
          }
        } catch {
          // Keep retrying — transient errors are expected while metadata loads
        }
      }, POLL_INTERVAL_MS);
    },
    [fetchData, stopPolling, pauseTorrent],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Internal state management ─────────────────────────────────────────

  const resetState = useCallback(() => {
    setSelectedItem(null);
    setFiles([]);
    setIsStarting(false);
  }, []);

  const closeModal = useCallback(() => {
    onModalClose();
    setTimeout(resetState, 200);
  }, [onModalClose, resetState]);

  // ── Preview loading ───────────────────────────────────────────────────

  const loadPreview = useCallback(
    async (item: FeedItem) => {
      const url = item.url;
      try {
        const { data } = await fetchData<TorrentPreviewResponse>(
          "/api/qbit/torrents/preview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
            silent: true,
          },
        );

        const hash = data.hash;
        if (!hash) return;

        const entry = torrentEntriesRef.current[url];
        if (!entry) return; // Entry was cleaned up — nothing to do.

        if (entry.action === "start") {
          // User clicked Download before metadata — start the torrent.
          delete torrentEntriesRef.current[url];
          try {
            await resumeTorrent(hash);
          } catch {
            addToast({ title: "Failed to start torrent", severity: "danger" });
          }
          return;
        }

        if (entry.action === "delete") {
          // User cancelled before metadata — delete the torrent.
          delete torrentEntriesRef.current[url];
          if (!data.alreadyExists) {
            try {
              await deleteTorrent(hash);
            } catch {
              /* best-effort cleanup */
            }
          }
          return;
        }

        // action === "ignore" — normal flow, show the preview.
        // Update the entry now that metadata resolved.
        entry.hash = hash;
        entry.alreadyExists = data.alreadyExists ?? false;

        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          if (!data.alreadyExists) {
            try {
              await pauseTorrent(hash);
            } catch {
              /* non-critical */
            }
          }
        } else {
          startPollingFiles(hash);
        }
      } catch (err) {
        const entry = torrentEntriesRef.current[url];
        const wasActive = entry?.action === "ignore";
        delete torrentEntriesRef.current[url];
        if (!wasActive) return;
        addToast({
          title: "Preview failed",
          description:
            err instanceof Error ? err.message : "Could not add torrent",
          severity: "danger",
        });
      }
    },
    [fetchData, resumeTorrent, deleteTorrent, pauseTorrent, startPollingFiles],
  );

  // ── Public API ────────────────────────────────────────────────────────

  const selectTorrent = useCallback(
    (item: FeedItem) => {
      // If the previous torrent is still pending, mark it for deletion.
      for (const key of Object.keys(torrentEntriesRef.current)) {
        const entry = torrentEntriesRef.current[key];
        if (entry.action === "ignore") entry.action = "delete";
      }
      stopPolling();

      setSelectedItem(item);
      setFiles([]);
      // For magnet links the infohash is in the URL — set it immediately so
      // the Download button works without waiting for the server round-trip.
      const magnetMatch = item.url.match(/urn:btih:([a-fA-F0-9]{40})/i);
      const hash = magnetMatch ? magnetMatch[1].toLowerCase() : "";
      torrentEntriesRef.current[item.url] = { action: "ignore", hash, alreadyExists: false };

      onModalOpen();
      loadPreview(item);
    },
    [stopPolling, onModalOpen, loadPreview],
  );

  const cancel = useCallback(async () => {
    const url = selectedItem?.url;
    stopPolling();
    closeModal();

    if (!url) return;

    const entry = torrentEntriesRef.current[url];
    const hash = entry?.hash;

    if (hash) {
      // Metadata resolved — we have the hash. Delete directly
      // unless the torrent already existed in qBit.
      delete torrentEntriesRef.current[url];
      if (!entry?.alreadyExists) {
        try {
          await deleteTorrent(hash);
        } catch {
          /* best-effort cleanup */
        }
      }
    } else if (entry) {
      // No hash yet — tell loadPreview to delete when it resolves.
      entry.action = "delete";
    }
  }, [selectedItem, stopPolling, closeModal, deleteTorrent]);

  const download = useCallback(async () => {
    const url = selectedItem?.url;
    const entry = url ? torrentEntriesRef.current[url] : undefined;
    const hash = entry?.hash;
    stopPolling();

    try {
      setIsStarting(true);
      if (url && hash) {
        // Metadata resolved — resume directly.
        delete torrentEntriesRef.current[url];
        await fetchData(`/api/qbit/torrents/${hash}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
      } else if (entry) {
        // No hash yet — tell loadPreview to start when it resolves.
        entry.action = "start";
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
  }, [fetchData, selectedItem, stopPolling, closeModal]);

  return {
    selectedItem,
    files,
    isStarting,
    isModalOpen,
    onModalOpenChange,
    selectTorrent,
    download,
    cancel,
  };
}
