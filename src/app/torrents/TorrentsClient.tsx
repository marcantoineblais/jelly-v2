"use client";

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
import useModal from "@/src/hooks/useModal";
import SelectInput from "@/src/components/ui/SelectInput";
import Modal from "@/src/components/Modal";
import CheckboxInput from "@/src/components/ui/CheckboxInput";
import Button from "@/src/components/ui/Button";
import Spinner from "@/src/components/ui/Spinner";

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
  } = useModal();

  const [torrents, setTorrents] = useState<QbitTorrent[]>(initialTorrents);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QbitTorrent | null>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [torrentFiles, setTorrentFiles] = useState<QbitTorrentFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const sortBy = (session.torrents?.sortBy as SortBy) ?? DEFAULT_SORT_BY;
  const sortOrder =
    (session.torrents?.sortOrder as "asc" | "desc") ?? DEFAULT_SORT_ORDER;

  const sortByOptions = useMemo(
    () =>
      TORRENT_SORT_BY.map((option) => ({
        label: option,
        value: option,
      })),
    [],
  );

  const sortOrderOptions = useMemo(
    () =>
      TORRENT_SORT_ORDER.map((option) => ({
        label: option,
        value: option,
      })),
    [],
  );

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
        <SelectInput
          id="sort-by"
          className="basis-2/3"
          label="Sort by"
          value={new Set([sortBy])}
          onChange={(value) => setSortBy([...value][0] as SortBy)}
          options={sortByOptions}
        />

        <SelectInput
          id="sort-order"
          className="basis-1/3"
          label="Order"
          value={new Set([sortOrder])}
          onChange={(value) => setSortOrder([...value][0] as "asc" | "desc")}
          options={sortOrderOptions}
        />
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
        title="Torrent Details"
        isOpen={isModalOpen}
        onClose={onModalClose}
        footer={
          <div className="w-full flex flex-col gap-4">
            <CheckboxInput
              id="delete-files"
              label="Delete files"
              className="self-start"
              checked={deleteFiles}
              onChange={setDeleteFiles}
            />
            <div className="w-full flex gap-2 justify-end">
              <Button
                className="w-32"
                color="default"
                onClick={handleCloseModal}
              >
                Close
              </Button>
              <Button
                className="w-32"
                color="danger"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        }
      >
        {selectedItem && (
          <div className="flex flex-col gap-2">
            <p className="break-all">{selectedItem?.name}</p>
            {isLoadingFiles ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : torrentFiles.length > 0 ? (
              <TorrentFileTree files={torrentFiles} />
            ) : null}
          </div>
        )}
      </Modal>
    </main>
  );
}
