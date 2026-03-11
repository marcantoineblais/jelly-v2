import { useCallback, useEffect, useRef, useState } from "react";
import { addToast, useDisclosure } from "@heroui/react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { TorrentPreviewResponse } from "@/src/app/api/qbit/torrents/preview/route";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { POLL_INTERVAL_MS } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

// Tracks what to do with a torrent when its metadata arrives.
// "resume" — user clicked Download before metadata was ready.
// "cancel" — user closed the modal (or opened another torrent) before metadata.
// "ignore" — torrent already existed in qBit or download already started; leave it alone.
type TorrentAction = "resume" | "cancel" | "ignore";

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

  // Hash of the torrent currently shown in the modal ("" when inactive).
  const pendingHashRef = useRef("");
  // Maps torrent hash → deferred action. The preview promise consults this
  // when it resolves to decide whether to resume, cancel or ignore.
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
    pendingHashRef.current = "";
  }, []);

  const closeModal = useCallback(() => {
    pendingHashRef.current = "";
    onModalClose();
    setTimeout(resetState, 200);
  }, [onModalClose, resetState]);

  // ── Preview loading ───────────────────────────────────────────────────

  const executeDeferredAction = useCallback(
    async (hash: string, alreadyExists: boolean) => {
      const action = torrentActionsRef.current[hash];
      if (!action) return false;

      delete torrentActionsRef.current[hash];
      if (action === "ignore") return true;

      try {
        if (action === "resume") {
          await resumeTorrent(hash);
        } else if (action === "cancel" && !alreadyExists) {
          await deleteTorrent(hash);
        }
      } catch {
        addToast({
          title: `Failed to ${action} torrent`,
          severity: "danger",
        });
      }

      return true;
    },
    [resumeTorrent, deleteTorrent],
  );

  const isStalePreview = useCallback((myHash: string, hash: string) => {
    return pendingHashRef.current !== myHash && pendingHashRef.current !== hash;
  }, []);

  const applyPreview = useCallback(
    async (hash: string, data: TorrentPreviewResponse) => {
      pendingHashRef.current = hash;
      if (data.alreadyExists) {
        torrentActionsRef.current[hash] = "ignore";
      }

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
    },
    [pauseTorrent, startPollingFiles],
  );

  const loadPreview = useCallback(
    async (item: FeedItem, myHash: string) => {
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

        if (await executeDeferredAction(hash, data.alreadyExists ?? false))
          return;

        if (isStalePreview(myHash, hash)) {
          if (!data.alreadyExists) {
            try {
              await deleteTorrent(hash);
            } catch {
              /* non-critical — best-effort cleanup */
            }
          }
          return;
        }

        await applyPreview(hash, data);
      } catch (err) {
        if (myHash) delete torrentActionsRef.current[myHash];
        if (isStalePreview(myHash, myHash)) return;
        addToast({
          title: "Preview failed",
          description:
            err instanceof Error ? err.message : "Could not add torrent",
          severity: "danger",
        });
      }
    },
    [fetchData, executeDeferredAction, isStalePreview, deleteTorrent, applyPreview],
  );

  // ── Public API ────────────────────────────────────────────────────────

  const selectTorrent = useCallback(
    (item: FeedItem) => {
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
      const myHash = magnetMatch ? magnetMatch[1].toLowerCase() : "";
      pendingHashRef.current = myHash;

      onModalOpen();
      loadPreview(item, myHash);
    },
    [stopPolling, onModalOpen, loadPreview],
  );

  const cancel = useCallback(async () => {
    const hash = pendingHashRef.current;
    const hasFiles = files.length > 0;
    stopPolling();
    closeModal();

    if (!hash) return;

    const action = torrentActionsRef.current[hash];
    if (action === "ignore") {
      delete torrentActionsRef.current[hash];
    } else if (hasFiles) {
      delete torrentActionsRef.current[hash];
      try {
        await deleteTorrent(hash);
      } catch {
        /* non-critical — best-effort cleanup */
      }
    } else {
      torrentActionsRef.current[hash] = "cancel";
    }
  }, [files, stopPolling, closeModal, deleteTorrent]);

  const download = useCallback(async () => {
    const hash = pendingHashRef.current;
    stopPolling();

    try {
      setIsStarting(true);
      if (hash) {
        // Mark "ignore" so the preview callback leaves this torrent alone —
        // we're starting the download directly.
        torrentActionsRef.current[hash] = "ignore";
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
