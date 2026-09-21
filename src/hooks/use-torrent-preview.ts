import { useCallback, useEffect, useState, useRef } from "react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { TorrentPreviewResponse } from "@/src/app/api/qbit/torrents/preview/route";
import type { QbitTorrentFile } from "@/src/libs/qbit/client";
import { POLL_INTERVAL_MS } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";
import useModal from "./useModal";
import { useToast } from "../providers/ToastProvider";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

export default function useTorrentPreview() {
  const { fetchData } = useFetch();
  const toast = useToast();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useModal();

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [files, setFiles] = useState<QbitTorrentFile[]>([]);
  const [hash, setHash] = useState("");
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const pollAbortRef = useRef<AbortController | null>(null);

  // ── qBit helpers ──────────────────────────────────────────────────────

  const pauseTorrent = useCallback(
    async (h: string) => {
      await fetchData(`/api/qbit/torrents/${h}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
        silent: true,
      });
    },
    [fetchData],
  );

  const deleteTorrent = useCallback(
    async (h: string) => {
      await fetchData(`/api/qbit/torrents/${h}`, {
        method: "DELETE",
        silent: true,
      });
    },
    [fetchData],
  );

  // ── Polling ───────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, []);

  const startPollingFiles = useCallback(
    (h: string) => {
      stopPolling();
      const controller = new AbortController();
      pollAbortRef.current = controller;

      const poll = async () => {
        while (!controller.signal.aborted) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (controller.signal.aborted) return;

          try {
            const { data } = await fetchData<HashFilesResponse>(
              `/api/qbit/torrents/${h}`,
              { silent: true },
            );
            if (data.files && data.files.length > 0) {
              setFiles(data.files);
              try {
                await pauseTorrent(h);
              } catch {
                /* non-critical — torrent stays active until user decides */
              }
              return;
            }
          } catch {
            // Keep retrying — transient errors are expected while metadata loads
          }
        }
      };

      poll();
    },
    [fetchData, stopPolling, pauseTorrent],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Internal state management ─────────────────────────────────────────

  const resetState = useCallback(() => {
    setSelectedItem(null);
    setFiles([]);
    setHash("");
    setAlreadyExists(false);
    setIsStarting(false);
  }, []);

  const closeModal = useCallback(() => {
    onModalClose();
  }, [onModalClose]);

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

        const h = data.hash;
        if (!h) {
          toast.error("Preview failed, no hash returned");
          closeModal();
          return;
        }

        setHash(h);
        setAlreadyExists(data.alreadyExists ?? false);

        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          if (!data.alreadyExists) {
            try {
              await pauseTorrent(h);
            } catch {
              /* non-critical */
            }
          }
        } else {
          startPollingFiles(h);
        }
      } catch (err) {
        toast.error(
          "Preview failed, " + (err as Error).message ||
            "Could not add torrent",
        );
        closeModal();
      }
    },
    [fetchData, toast, closeModal, pauseTorrent, startPollingFiles],
  );

  // ── Public API ────────────────────────────────────────────────────────

  const selectTorrent = useCallback(
    (item: FeedItem) => {
      stopPolling();
      setSelectedItem(item);
      setFiles([]);
      setHash("");
      setAlreadyExists(false);
      onModalOpen();
      loadPreview(item);
    },
    [stopPolling, onModalOpen, loadPreview],
  );

  const cancel = useCallback(async () => {
    if (!hash) return;

    const existed = alreadyExists;
    stopPolling();
    closeModal();

    if (existed) return;
    try {
      await deleteTorrent(hash);
    } catch {
      /* best-effort cleanup */
    }
  }, [hash, alreadyExists, stopPolling, closeModal, deleteTorrent]);

  const download = useCallback(async () => {
    stopPolling();
    try {
      setIsStarting(true);
      await fetchData(`/api/qbit/torrents/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      toast.success("Downloading " + selectedItem?.title);
    } catch {
      /* useFetch shows error toast */
    } finally {
      setIsStarting(false);
    }
    closeModal();
  }, [stopPolling, closeModal, fetchData, hash, toast, selectedItem]);

  return {
    selectedItem,
    files,
    isStarting,
    isLoading: !hash,
    isModalOpen,
    selectTorrent,
    download,
    cancel,
    resetState,
  };
}
