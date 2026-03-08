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
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import useFetch from "@/src/hooks/use-fetch";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import {
  TORRENT_SORT_BY,
  TORRENT_SORT_ORDER,
  POLL_INTERVAL_MS,
} from "@/src/config";
import type { QbitTorrent, QbitTorrentFile } from "@/src/libs/qbit/client";
import Table from "@/src/components/table/table";
import TorrentTableItem from "@/src/components/table/torrent-table-item";
import TorrentFileTree from "@/src/components/torrent-file-tree/FileTree";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";
import { useSession } from "@/src/providers/session-provider-client";

export type SortBy = "name" | "size" | "progress" | "status" | "eta";

type TorrentsClientProps = {
  initialTorrents: QbitTorrent[];
};

const DEFAULT_SORT_BY: SortBy = "name";
const DEFAULT_SORT_ORDER = "asc" as const;

export default function TorrentsClient({
  initialTorrents,
}: TorrentsClientProps) {
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
  const [torrentFiles, setTorrentFiles] = useState<QbitTorrentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const sortBy = (session.torrents?.sortBy as SortBy) ?? DEFAULT_SORT_BY;
  const sortOrder =
    (session.torrents?.sortOrder as "asc" | "desc") ?? DEFAULT_SORT_ORDER;

  function setSortBy(value: SortBy) {
    updateSession({ torrents: { sortBy: value, sortOrder } });
  }

  function setSortOrder(value: "asc" | "desc") {
    updateSession({ torrents: { sortBy, sortOrder: value } });
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

  async function handleSelectItem(item: QbitTorrent) {
    setSelectedItem(item);
    setDeleteFiles(false);
    setTorrentFiles([]);
    setIsLoadingFiles(true);
    onModalOpen();
    try {
      const { data } = await fetchData<{
        ok: boolean;
        files?: QbitTorrentFile[];
      }>(`/api/qbit/torrents/${item.hash}`, { silent: true });
      setTorrentFiles(data.files ?? []);
    } catch {
      /* non-critical — show empty list */
    } finally {
      setIsLoadingFiles(false);
    }
  }

  function handleCloseModal() {
    onModalClose();
    setTimeout(() => {
      setSelectedItem(null);
      setTorrentFiles([]);
    }, 200);
  }

  function handleOpenChange(open: boolean) {
    if (!open) handleCloseModal();
    onModalOpenChange();
  }

  useEffect(() => {
    const pollTorrents = async () => {
      try {
        const { data } = await fetchData<QbittorrentResponse>(
          "/api/qbit/torrents",
          { silent: true },
        );
        setTorrents(data.torrents);
      } catch {
        // Keep showing stale data on poll failure
      }
    };

    const id = setInterval(pollTorrents, POLL_INTERVAL_MS);
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
    <main className="container-main w-full h-full flex flex-col gap-4 p-4 pb-8 overflow-hidden">
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
          {TORRENT_SORT_BY.map((sortBy) => (
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
          {TORRENT_SORT_ORDER.map((sortOrder) => (
            <SelectItem key={sortOrder}>{sortOrder}</SelectItem>
          ))}
        </Select>
      </div>

      {/* Torrents table */}
      {sortedTorrents.length === 0 ? (
        <div className="flex w-full h-full justify-center items-center">
          <MediaListEmpty
            title="No torrents found"
            message="Add some and come back later."
          />
        </div>
      ) : (
        <Table items={sortedTorrents}>
          {(item) => (
            <TorrentTableItem
              key={item.hash}
              item={item}
              onClick={() => handleSelectItem(item)}
            />
          )}
        </Table>
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
            <ModalBody className="flex flex-col gao-2">
              <p className="break-all">{selectedItem?.name}</p>
              {isLoadingFiles ? (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : torrentFiles.length > 0 ? (
                <TorrentFileTree files={torrentFiles} />
              ) : null}
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Checkbox isSelected={deleteFiles} onValueChange={setDeleteFiles}>
                Delete files
              </Checkbox>
              <div className="flex gap-2 justify-center">
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
              </div>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </main>
  );
}
