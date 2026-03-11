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

  // URL of the torrent currently shown in the modal ("" when inactive).
  // Used as the stable key for deferred actions since it's available
  // immediately — before the hash is resolved from metadata.
  const pendingKeyRef = useRef("");
  // Hash of the torrent currently shown in the modal ("" until resolved).
  const pendingHashRef = useRef("");
  // Maps torrent URL → deferred action. The preview promise consults this
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
    pendingKeyRef.current = "";
    pendingHashRef.current = "";
  }, []);

  const closeModal = useCallback(() => {
    pendingKeyRef.current = "";
    pendingHashRef.current = "";
    onModalClose();
    setTimeout(resetState, 200);
  }, [onModalClose, resetState]);

  // ── Preview loading ───────────────────────────────────────────────────

  const executeDeferredAction = useCallback(
    async (urlKey: string, hash: string, alreadyExists: boolean) => {
      const action = torrentActionsRef.current[urlKey];
      if (!action) return false;

      delete torrentActionsRef.current[urlKey];
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

  const isStalePreview = useCallback((urlKey: string) => {
    return pendingKeyRef.current !== urlKey;
  }, []);

  const applyPreview = useCallback(
    async (urlKey: string, hash: string, data: TorrentPreviewResponse) => {
      pendingHashRef.current = hash;
      if (data.alreadyExists) {
        torrentActionsRef.current[urlKey] = "ignore";
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
    async (item: FeedItem) => {
      const urlKey = item.url;
      try {
        const { data } = await fetchData<TorrentPreviewResponse>(
          "/api/qbit/torrents/preview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: urlKey }),
            silent: true,
          },
        );

        const hash = data.hash;
        if (!hash) return;

        // Now that we have the hash, check if there's a deferred action
        // recorded against this URL (e.g. user clicked Download or closed
        // the modal before metadata arrived).
        if (await executeDeferredAction(urlKey, hash, data.alreadyExists ?? false))
          return;

        if (isStalePreview(urlKey)) {
          if (!data.alreadyExists) {
            try {
              await deleteTorrent(hash);
            } catch {
              /* non-critical — best-effort cleanup */
            }
          }
          return;
        }

        pendingHashRef.current = hash;
        await applyPreview(urlKey, hash, data);
      } catch (err) {
        delete torrentActionsRef.current[urlKey];
        if (isStalePreview(urlKey)) return;
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
      // Mark the previous torrent for cancellation if it wasn't already handled.
      const prevKey = pendingKeyRef.current;
      if (prevKey && torrentActionsRef.current[prevKey] !== "ignore") {
        torrentActionsRef.current[prevKey] = "cancel";
      }
      stopPolling();

      setSelectedItem(item);
      setFiles([]);

      pendingKeyRef.current = item.url;
      // For magnet links the infohash is in the URL — set it immediately so
      // the Download button works without waiting for the server round-trip.
      const magnetMatch = item.url.match(/urn:btih:([a-fA-F0-9]{40})/i);
      pendingHashRef.current = magnetMatch ? magnetMatch[1].toLowerCase() : "";

      onModalOpen();
      loadPreview(item);
    },
    [stopPolling, onModalOpen, loadPreview],
  );

  const cancel = useCallback(async () => {
    const urlKey = pendingKeyRef.current;
    const hash = pendingHashRef.current;
    stopPolling();
    closeModal();

    if (!urlKey) return;

    const action = torrentActionsRef.current[urlKey];
    if (action === "ignore") {
      // Torrent already existed or download already started — leave it alone.
      delete torrentActionsRef.current[urlKey];
    } else if (hash) {
      // Hash is known — delete directly.
      delete torrentActionsRef.current[urlKey];
      try {
        await deleteTorrent(hash);
      } catch {
        /* non-critical — best-effort cleanup */
      }
    } else {
      // Hash not yet available — defer cancellation so loadPreview can
      // delete the torrent once it resolves with the hash.
      torrentActionsRef.current[urlKey] = "cancel";
    }
  }, [stopPolling, closeModal, deleteTorrent]);

  const download = useCallback(async () => {
    const urlKey = pendingKeyRef.current;
    const hash = pendingHashRef.current;
    stopPolling();

    try {
      setIsStarting(true);
      if (hash) {
        // Hash is known — resume directly and mark "ignore" so the preview
        // callback leaves this torrent alone.
        if (urlKey) torrentActionsRef.current[urlKey] = "ignore";
        await fetchData(`/api/qbit/torrents/${hash}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
      } else if (urlKey) {
        // Hash isn't available yet (preview still in-flight). Record a
        // "resume" action against the URL so loadPreview starts the torrent
        // once it resolves.
        torrentActionsRef.current[urlKey] = "resume";
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
