"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import useTorrentPreview from "@/src/hooks/use-torrent-preview";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";
import TorrentFileTree from "@/src/components/torrent-file-tree/FileTree";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";

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
  const {
    selectedItem,
    files,
    isStarting,
    isModalOpen,
    onModalOpenChange,
    selectTorrent,
    download,
    cancel,
  } = useTorrentPreview();

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
              onClick={() => selectTorrent(item)}
            />
          )}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onOpenChange={onModalOpenChange}
        placement="center"
        scrollBehavior="inside"
        onClose={cancel}
      >
        {selectedItem && (
          <ModalContent>
            <ModalHeader>Metadata</ModalHeader>

            <ModalBody className="flex flex-col gap-2">
              <p className="break-all">{selectedItem.title}</p>
              {files.length === 0 ? (
                <div className="w-full flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  <p className="text-start">Files:</p>
                  <TorrentFileTree files={files} />
                </>
              )}
            </ModalBody>

            <ModalFooter className="flex justify-center gap-2">
              <Button
                className="w-32"
                color="default"
                variant="ghost"
                onPress={cancel}
              >
                Cancel
              </Button>
              <Button
                className="w-32"
                color="primary"
                variant="solid"
                onPress={download}
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
