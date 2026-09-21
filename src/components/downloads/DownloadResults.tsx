"use client";

import type { FeedItem } from "@/src/libs/downloads/feed-format";
import useTorrentPreview from "@/src/hooks/use-torrent-preview";
import Table from "@/src/components/table/table";
import TableItem from "@/src/components/table/feed-table-item";
import TorrentFileTree from "@/src/components/torrent-file-tree/FileTree";
import MediaListEmpty from "@/src/components/media/MediaListEmpty";
import Modal from "../Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

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
    isLoading,
    isModalOpen,
    selectTorrent,
    download,
    cancel,
    resetState,
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
        title="Metadata"
        isOpen={isModalOpen}
        onClose={cancel}
        onUnmount={resetState}
        footer={
          <>
            <Button
              className="w-32"
              color="default"
              isDisabled={isLoading}
              onClick={cancel}
            >
              Cancel
            </Button>
            <Button
              className="w-32"
              color="primary"
              isDisabled={isLoading}
              isLoading={isStarting}
              onClick={download}
            >
              Download
            </Button>
          </>
        }
      >
        {selectedItem && (
          <div className="flex flex-col gap-2">
            <p className="break-all">{selectedItem.title}</p>
            {files.length === 0 ? (
              <div className="w-full flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                <p className="text-start">Files:</p>
                <TorrentFileTree files={files} />
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
