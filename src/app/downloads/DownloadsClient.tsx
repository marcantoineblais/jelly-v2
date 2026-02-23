"use client";

import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import useFetch from "@/src/hooks/use-fetch";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import {
  DOWNLOAD_SORT_BY,
  DOWNLOAD_SORT_ORDER,
  POLL_INTERVAL_MS,
} from "@/src/config";
import type { QbitTorrent } from "@/src/libs/qbit/client";
import { formatDataSize } from "@/src/libs/format-data-size";
import { formatEta, formatSpeed, formatState } from "@/src/libs/qbit/format";
import Table from "@/src/components/table/table";
import TorrentTableItem from "@/src/components/table/torrent-table-item";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";
import { useSession } from "@/src/providers/session-provider-client";

export type SortBy = "name" | "size" | "progress" | "status" | "eta";

type DownloadsClientProps = {
  initialTorrents: QbitTorrent[];
};

const DEFAULT_SORT_BY: SortBy = "name";
const DEFAULT_SORT_ORDER = "asc" as const;

export default function DownloadsClient({
  initialTorrents,
}: DownloadsClientProps) {
  const { session, updateSession } = useSession();
  const { fetchData } = useFetch();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  const [torrents, setTorrents] = useState<QbitTorrent[]>(initialTorrents);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QbitTorrent | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);

  const sortBy = (session.downloads?.sortBy as SortBy) ?? DEFAULT_SORT_BY;
  const sortOrder =
    (session.downloads?.sortOrder as "asc" | "desc") ?? DEFAULT_SORT_ORDER;

  function setSortBy(value: SortBy) {
    updateSession({ downloads: { sortBy: value, sortOrder } });
  }

  function setSortOrder(value: "asc" | "desc") {
    updateSession({ downloads: { sortBy, sortOrder: value } });
  }

  const sortedTorrents = useMemo(() => {
    const toSort = [...torrents];
    return toSort.sort((a, b) => {
      const mult = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name) * mult;
        case "eta":
          return (a.eta - b.eta) * mult;
        case "progress":
          return (a.progress - b.progress) * mult;
        case "size":
          return (a.size - b.size) * mult;
        case "status":
          return a.state.localeCompare(b.state) * mult;
        default:
          return 0;
      }
    });
  }, [torrents, sortBy, sortOrder]);

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

    const id = setInterval(fetchTorrent, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  async function deleteTorrent(hash: string, deleteFiles: boolean) {
    if (hash.startsWith("mock-")) {
      setTorrents((prev) => prev.filter((t) => t.hash !== hash));
      return;
    }
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

  return (
    <main className="w-full flex-1 min-h-0 flex flex-col gap-4 bg-stone-100 p-4 pb-8 overflow-hidden">
      {/* Sorting controls */}
      <div className="flex gap-2 bg-white/80 rounded-lg border border-stone-200 p-3">
        <Select
          className="basis-2/3"
          label="Sort by"
          selectedKeys={[sortBy]}
          onSelectionChange={(selection) => {
            const key = Array.from(selection)[0] as SortBy;
            if (key) setSortBy(key);
          }}
        >
          {DOWNLOAD_SORT_BY.map((sortBy) => (
            <SelectItem key={sortBy}>{sortBy}</SelectItem>
          ))}
        </Select>

        <Select
          className="basis-1/3"
          label="Order"
          selectedKeys={[sortOrder]}
          onSelectionChange={(selection) => {
            const key = Array.from(selection)[0] as "asc" | "desc";
            if (key) setSortOrder(key);
          }}
        >
          {DOWNLOAD_SORT_ORDER.map((sortOrder) => (
            <SelectItem key={sortOrder}>{sortOrder}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Torrents table */}
      {sortedTorrents.length === 0 ? (
        <div className="flex w-full grow justify-center items-center">
          <MediaListEmpty
            title="No torrents found"
            message="Add some and come back later."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0 max-h-fit overflow-hidden">
          <Table items={sortedTorrents}>
            {(item) => (
              <TorrentTableItem
                key={item.hash}
                item={item}
                onClick={() => handleSelectItem(item)}
              />
            )}
          </Table>
        </div>
      )}

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
                className="w-32"
                color="default"
                variant="ghost"
                onPress={handleCloseModal}
              >
                Close
              </Button>
              <Button
                className="w-32"
                color="danger"
                variant="solid"
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
