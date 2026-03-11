import { useCallback, useEffect, useRef, useState } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { TorrentPreviewResponse } from "@/src/app/api/qbit/torrents/preview/route";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { POLL_INTERVAL_MS } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

// Deferred action recorded against a torrent URL while metadata is loading.
// "ignore" — default; we don't know what the user wants yet.
// "start"  — user clicked Download before metadata arrived; start when hash resolves.
// "delete" — user cancelled / switched torrent before metadata arrived; delete when hash resolves.
type TorrentAction = "ignore" | "start" | "delete";

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

  // URL of the torrent currently shown in the modal ("" when inactive).
  const pendingUrlRef = useRef("");
  // Hash of the current torrent ("" until metadata resolves).
  const pendingHashRef = useRef("");
  // True when the torrent was already in qBit before we added it.
  const alreadyExistsRef = useRef(false);
  // URL → deferred action. Only populated while loadPreview is in-flight.
  const torrentActionsRef = useRef<Record<string, TorrentAction>>({});
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
    pendingUrlRef.current = "";
    pendingHashRef.current = "";
    alreadyExistsRef.current = false;
  }, []);

  const closeModal = useCallback(() => {
    pendingUrlRef.current = "";
    pendingHashRef.current = "";
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

        // Read and clear the deferred action for this URL.
        const action = torrentActionsRef.current[url] ?? "ignore";
        delete torrentActionsRef.current[url];

        if (action === "start") {
          // User clicked Download before metadata — start the torrent.
          try {
            await resumeTorrent(hash);
          } catch {
            addToast({ title: "Failed to start torrent", severity: "danger" });
          }
          return;
        }

        if (action === "delete") {
          // User cancelled before metadata — delete the torrent.
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
        // If user already switched to another torrent, this is stale.
        if (pendingUrlRef.current !== url) {
          if (!data.alreadyExists) {
            try {
              await deleteTorrent(hash);
            } catch {
              /* best-effort cleanup */
            }
          }
          return;
        }

        // Apply the preview.
        pendingHashRef.current = hash;
        alreadyExistsRef.current = data.alreadyExists ?? false;

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
        delete torrentActionsRef.current[url];
        if (pendingUrlRef.current !== url) return;
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
      // If the previous torrent's preview is still in-flight, mark it for deletion.
      const prevUrl = pendingUrlRef.current;
      if (prevUrl && torrentActionsRef.current[prevUrl] === "ignore") {
        torrentActionsRef.current[prevUrl] = "delete";
      }
      stopPolling();

      setSelectedItem(item);
      setFiles([]);

      pendingUrlRef.current = item.url;
      const magnetMatch = item.url.match(/urn:btih:([a-fA-F0-9]{40})/i);
      pendingHashRef.current = magnetMatch ? magnetMatch[1].toLowerCase() : "";
      alreadyExistsRef.current = false;
      torrentActionsRef.current[item.url] = "ignore";

      onModalOpen();
      loadPreview(item);
    },
    [stopPolling, onModalOpen, loadPreview],
  );

  const cancel = useCallback(async () => {
    const url = pendingUrlRef.current;
    const hash = pendingHashRef.current;
    stopPolling();
    closeModal();

    if (!url) return;

    if (hash) {
      // Metadata resolved — we have the hash. Delete directly
      // unless the torrent already existed in qBit.
      delete torrentActionsRef.current[url];
      if (!alreadyExistsRef.current) {
        try {
          await deleteTorrent(hash);
        } catch {
          /* best-effort cleanup */
        }
      }
    } else {
      // No hash yet — tell loadPreview to delete when it resolves.
      torrentActionsRef.current[url] = "delete";
    }
  }, [stopPolling, closeModal, deleteTorrent]);

  const download = useCallback(async () => {
    const url = pendingUrlRef.current;
    const hash = pendingHashRef.current;
    stopPolling();

    try {
      setIsStarting(true);
      if (hash) {
        // Metadata resolved — resume directly.
        delete torrentActionsRef.current[url];
        await fetchData(`/api/qbit/torrents/${hash}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
      } else if (url) {
        // No hash yet — tell loadPreview to start when it resolves.
        torrentActionsRef.current[url] = "start";
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
