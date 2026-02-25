"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  addToast,
  useDisclosure,
} from "@heroui/react";
import type { FeedItem } from "@/src/libs/torrents/feed-format";
import type { QbittorrentResponse } from "@/src/app/api/qbit/torrents/route";
import useFetch from "@/src/hooks/use-fetch";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";

type TorrentResultsProps = {
  items: FeedItem[];
  hasSearched: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
};

export default function TorrentResults({
  items,
  hasSearched,
  emptyTitle = "No torrents found",
  emptyMessage = "Change your search criteria and try again.",
}: TorrentResultsProps) {
  const { fetchData } = useFetch();
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [isAddingToQbittorrent, setIsAddingToQbittorrent] = useState(false);

  function handleSelectItem(item: FeedItem) {
    setSelectedItem(item);
    onModalOpen();
  }

  function handleCloseModal() {
    onModalClose();
    setTimeout(() => setSelectedItem(null), 200);
  }

  async function addToQbittorrent(item: FeedItem) {
    if (!item.url) {
      addToast({
        title: "No link",
        description: "This item has no magnet or torrent link to add.",
        severity: "warning",
      });
      return;
    }
    try {
      await fetchData<QbittorrentResponse>("/api/qbit/torrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
        setIsLoading: setIsAddingToQbittorrent,
      });
      addToast({
        title: "Added to qBittorrent",
        description: item.title,
        severity: "success",
      });
    } catch {
      /* useFetch shows error toast */
    }
    handleCloseModal();
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
            <ModalHeader>Details</ModalHeader>
            <ModalBody>
              <div className="w-full">
                <p className="break-all">{selectedItem.title}</p>
                <div className="mt-4">
                  <p>Size: {selectedItem.size}</p>
                  <p>Seeds: {selectedItem.seeds}</p>
                  <p>Leech: {selectedItem.leech}</p>
                  <p>Published: {selectedItem.pubDate}</p>
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
                color="primary"
                variant="solid"
                onPress={() => addToQbittorrent(selectedItem)}
                isLoading={isAddingToQbittorrent}
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
