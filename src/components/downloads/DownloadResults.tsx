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
import useFetch from "@/src/hooks/use-fetch";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";
import MetadataFilesItem from "@/src/components/table/metadata-files-item";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";

type HashFilesResponse = { ok: boolean; files?: QbitTorrentFile[] };

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

  const pendingHashRef = useRef<string | null>(null);
  const alreadyExistsRef = useRef(false);
  const modalActiveRef = useRef(false);
  // Polling interval id for the file list.
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPromiseRef = useRef<Promise<void> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  function resetModalState() {
    setSelectedItem(null);
    setFiles([]);
    setIsStarting(false);
    pendingHashRef.current = null;
    alreadyExistsRef.current = false;
  }

  async function deletePendingHash() {
    if (alreadyExistsRef.current) return;
    const hash = pendingHashRef.current;
    pendingHashRef.current = null;
    if (!hash) return;
    try {
      await fetchData(`/api/qbit/torrents/${hash}`, { method: "DELETE" });
    } catch {
      /* useFetch shows error toast */
    }
  }

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
              await fetchData(`/api/qbit/torrents/${hash}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pause" }),
                silent: true,
              });
            } catch {
              /* non-critical — torrent stays active until user decides */
            }
          }
        } catch {
          // Keep retrying — transient errors are expected while metadata loads
        }
      }, 1000);
    },
    [fetchData, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  function handleSelectItem(item: FeedItem) {
    setSelectedItem(item);
    setFiles([]);
    alreadyExistsRef.current = false;
    modalActiveRef.current = true;

    // For magnet links the infohash is in the URL — set it immediately so
    // the Download button works without waiting for the server round-trip.
    const magnetMatch = item.url.match(/urn:btih:([a-fA-F0-9]{40})/i);
    pendingHashRef.current = magnetMatch ? magnetMatch[1].toLowerCase() : null;

    onModalOpen();

    const promise = (async () => {
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

        if (!modalActiveRef.current) {
          if (data.hash) {
            pendingHashRef.current = data.hash;
            deletePendingHash();
          }
          return;
        }

        pendingHashRef.current = data.hash ?? null;
        alreadyExistsRef.current = data.alreadyExists ?? false;

        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          if (!data.alreadyExists) {
            try {
              await fetchData(`/api/qbit/torrents/${data.hash}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "pause" }),
                silent: true,
              });
            } catch {
              /* non-critical */
            }
          }
        } else if (data.hash) {
          startPollingFiles(data.hash);
        }
      } catch (err) {
        if (!modalActiveRef.current) return;
        addToast({
          title: "Preview failed",
          description:
            err instanceof Error ? err.message : "Could not add torrent",
          severity: "danger",
        });
      } finally {
        previewPromiseRef.current = null;
      }
    })();

    previewPromiseRef.current = promise;
  }

  function handleCloseModal() {
    modalActiveRef.current = false;
    stopPolling();
    deletePendingHash();
    onModalClose();
    setTimeout(resetModalState, 200);
  }

  async function handleDownload() {
    const hash = pendingHashRef.current;
    pendingHashRef.current = null;
    modalActiveRef.current = false;
    stopPolling();

    try {
      setIsStarting(true);
      if (hash) {
        // We already have the torrent in qBit (paused) — just resume it
        await fetchData(`/api/qbit/torrents/${hash}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resume" }),
        });
      } else {
        // Metadata not ready — add the URL directly and let it download
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

    onModalClose();
    setTimeout(resetModalState, 200);
  }

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
              <p>selectedItem?.title</p>
              {files.length === 0 ? (
                <div className="w-full flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-start">Files:</p>
                  <Table items={files}>
                    {(file) => (
                      <MetadataFilesItem key={file.index} file={file} />
                    )}
                  </Table>
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
