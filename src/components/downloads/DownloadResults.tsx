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
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

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
          <MediaListEmpty
            icon={faMagnifyingGlass}
            title={emptyTitle}
            message={emptyMessage}
          />
        </div>
      )}

      {hasSearched && items.length > 0 && (
        <Table items={items}>
          {(item, index) => (
            <TableItem
              key={item.id}
              item={item}
              index={index}
              onClick={() => selectTorrent(item)}
            />
          )}
        </Table>
      )}

      <Modal
        title="Download torrent"
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
          <div className="flex flex-col gap-4 md:w-lg">
            <div className="rounded-xl bg-surface/60 border border-border px-3 py-2.5">
              <p className="text-sm font-medium text-text break-all">
                {selectedItem.title}
              </p>
              <p className="mt-1 text-xs text-text-muted tabular-nums">
                {[
                  selectedItem.size,
                  selectedItem.seeds != null && `${selectedItem.seeds} seeds`,
                  selectedItem.pubDate,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {files.length === 0 ? (
              <div className="w-full flex flex-col items-center gap-3 py-8 text-xs text-text-muted">
                <Spinner size="sm" />
                Fetching file list…
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] uppercase tracking-wider text-text-muted">
                  {files.length} file{files.length > 1 ? "s" : ""}
                </p>
                <TorrentFileTree files={files} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
