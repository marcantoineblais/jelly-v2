"use client";

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useState } from "react";
import {
  formatEta,
  formatSize,
  formatSpeed,
  formatState,
} from "@/src/libs/qbit/format";
import useFetch from "@/src/hooks/use-fetch";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import LoadIndicator from "@/src/components/ui/load-indicator";
import { POLL_INTERVAL_MS } from "@/src/config";

type QbitTorrent = {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  dlspeed: number;
  eta: number;
};

export default function DownloadsPage() {
  const { fetchData } = useFetch();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  function handleOpenChange(open: boolean) {
    if (!open) {
      setHashToDelete(null);
      onClose();
    }
    onOpenChange();
  }
  const [torrents, setTorrents] = useState<QbitTorrent[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hashToDelete, setHashToDelete] = useState<string | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);

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

  function handleDeleteClick(hash: string) {
    setHashToDelete(hash);
    setDeleteFiles(false);
    onOpen();
  }

  async function handleConfirmDelete() {
    if (!hashToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTorrent(hashToDelete, deleteFiles);
      onClose();
      setHashToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8">
      {isPageLoading && <LoadIndicator />}

      <Table className="w-full text-left text-sm" aria-label="Downloads">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Progress</TableColumn>
          <TableColumn>Size</TableColumn>
          <TableColumn>Down</TableColumn>
          <TableColumn>ETA</TableColumn>
          <TableColumn>
            <></>
          </TableColumn>
        </TableHeader>
        <TableBody items={torrents} emptyContent="No torrents in qBittorrent.">
          {(t) => (
            <TableRow key={t.hash}>
              <TableCell className="min-w-[200px]">{t.name || "—"}</TableCell>
              <TableCell>{formatState(t.state)}</TableCell>
              <TableCell>{(t.progress * 100).toFixed(1)}%</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatSize(t.size)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatSpeed(t.dlspeed)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatEta(t.eta)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => handleDeleteClick(t.hash)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={handleOpenChange} placement="center">
        <ModalContent>
          <ModalHeader>Delete Torrent</ModalHeader>
          <ModalBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
            >
              <div className="flex flex-col gap-2">
                <p>Are you sure you want to delete this torrent?</p>
                <Checkbox
                  isSelected={deleteFiles}
                  onValueChange={setDeleteFiles}
                >
                  Delete files
                </Checkbox>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  color="default"
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setHashToDelete(null);
                    onClose();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  color="danger"
                  isLoading={isDeleting}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </main>
  );
}
