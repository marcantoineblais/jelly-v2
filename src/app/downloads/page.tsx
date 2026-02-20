"use client";

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useState } from "react";
import useFetch from "@/src/hooks/use-fetch";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import { POLL_INTERVAL_MS } from "@/src/config";
import type { QbitTorrent } from "@/src/libs/qbit/client";
import { formatDataSize } from "@/src/libs/format-data-size";
import { formatEta, formatSpeed, formatState } from "@/src/libs/qbit/format";
import Table from "@/src/components/table/table";
import TorrentTableItem from "@/src/components/table/torrent-table-item";

export default function DownloadsPage() {
  const { fetchData } = useFetch();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  const [torrents, setTorrents] = useState<QbitTorrent[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QbitTorrent | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);

  function handleSelectItem(item: QbitTorrent) {
    setSelectedItem(item);
    setDeleteFiles(false);
    onModalOpen();
  }

  function handleCloseModal() {
    onModalClose();
    setTimeout(() => {
      setSelectedItem(null);
    }, 200);
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleCloseModal();
    onModalOpenChange();
  }

  useEffect(() => {
    const fetchTorrent = async () => {
      try {
        const { data } =
          await fetchData<QbittorrentResponse>("/api/qbit/torrents");
        setTorrents(data.torrents);
      } catch {
        setTorrents([]);
      }
    };

    // First fetch
    fetchTorrent();
    setIsPageLoading(false);

    // Poll interval
    const id = setInterval(fetchTorrent, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  async function deleteTorrent(hash: string, deleteFiles: boolean) {
    try {
      const url = `/api/qbit/torrents/${encodeURIComponent(hash)}${deleteFiles ? "?deleteFiles=true" : ""}`;
      const { data } = await fetchData<QbittorrentResponse>(url, {
        method: "DELETE",
      });
      if (!data.ok) return;
      setTorrents((prev) => prev.filter((t) => t.hash !== hash));
    } catch {}
  }

  async function handleConfirmDelete() {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      await deleteTorrent(selectedItem.hash, deleteFiles);
      handleCloseModal();
    } finally {
      setIsDeleting(false);
    }
  }

  if (isPageLoading) {
    return null;
  }

  return (
    <main className="w-full h-full flex flex-col gap-4 bg-stone-100 p-4 pb-8">
      <Table items={torrents}>
        {(item) => (
          <TorrentTableItem
            key={item.hash}
            item={item}
            onClick={() => handleSelectItem(item)}
          />
        )}
      </Table>

      <Modal
        isOpen={isModalOpen}
        onOpenChange={handleOpenChange}
        placement="center"
        scrollBehavior="inside"
        onClose={handleCloseModal}
      >
        {selectedItem && (
          <ModalContent>
            <ModalHeader>Details</ModalHeader>
            <ModalBody>
              <div className="w-full">
                <p className="break-all">{selectedItem.name}</p>
                <div className="mt-4 flex flex-col gap-1">
                  <p>Status: {formatState(selectedItem.state)}</p>
                  <p>Progress: {(selectedItem.progress * 100).toFixed(1)}%</p>
                  <p>Size: {formatDataSize(selectedItem.size)}</p>
                  <p>Down: {formatSpeed(selectedItem.dlSpeed ?? 0)}</p>
                  <p>Up: {formatSpeed(selectedItem.upSpeed ?? 0)}</p>
                  <p>Seeds: {selectedItem.numSeeds ?? "-"}</p>
                  <p>Leech: {selectedItem.numLeechs ?? "-"}</p>
                  <p>ETA: {formatEta(selectedItem.eta ?? -1)}</p>
                </div>
                <div className="mt-4">
                  <Checkbox
                    isSelected={deleteFiles}
                    onValueChange={setDeleteFiles}
                  >
                    Delete files
                  </Checkbox>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-center gap-2">
              <Button
                color="default"
                variant="ghost"
                onPress={handleCloseModal}
              >
                Close
              </Button>
              <Button
                color="danger"
                variant="ghost"
                onPress={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </main>
  );
}
