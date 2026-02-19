"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  addToast,
} from "@heroui/react";
import type { JackettIndexer } from "@/src/libs/torrents/jackett";
import {
  formatDate,
  getAddableUrl,
  SortBy,
  type FeedItem,
} from "@/src/libs/torrents/feed-format";
import useFetch from "../../hooks/use-fetch";
import LoadIndicator from "@/src/components/ui/load-indicator";
import { JackettIndexerResponse } from "../api/torrents/indexers/route";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import { FeedResponse } from "../api/torrents/feed/route";

type FormData = {
  title: string;
  indexers: Set<string>;
  sortBy: SortBy;
};

export default function TorrentsPage() {
  const { fetchData } = useFetch();

  // Form states
  const [formData, setFormData] = useState<FormData>({
    title: "",
    indexers: new Set<string>(),
    sortBy: "date",
  });

  // Data states
  const [items, setItems] = useState<
    (FeedItem & { isAddingToQbittorrent: boolean })[]
  >([]);
  const [indexers, setIndexers] = useState<JackettIndexer[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchIndexers = async () => {
      try {
        const { data } = await fetchData<JackettIndexerResponse>(
          "/api/torrents/indexers",
          {
            setIsLoading: setIsPageLoading,
          },
        );
        setIndexers(data.indexers);
      } catch {
        setIndexers([]);
      }
    };

    fetchIndexers();
  }, []);

  function toggleSelectedItem(item: FeedItem, state: boolean) {
    setItems((prevItems) =>
      prevItems.map((prevItem) => {
        if (
          prevItem.link === item.link &&
          prevItem.pubDateMs === item.pubDateMs &&
          prevItem.title === item.title
        ) {
          return { ...prevItem, isAddingToQbittorrent: state };
        }
        return prevItem;
      }),
    );
  }

  async function fetchPage(pageNum: number) {
    const { title, indexers: selectedIndexers, sortBy } = formData;
    const titleQuery = title.trim();
    const indexersQuery = Array.from(selectedIndexers).join(",");
    const searchParams = new URLSearchParams();
    searchParams.set("name", titleQuery);
    searchParams.set("indexers", indexersQuery);
    searchParams.set("sortBy", sortBy);
    searchParams.set("page", String(pageNum));
    searchParams.set("limit", String(limit));
    const { data } = await fetchData<FeedResponse>(
      `/api/torrents/feed?${searchParams.toString()}`,
      { setIsLoading: setIsSearchLoading },
    );
    setItems(
      data.items.map((item) => ({ ...item, isAddingToQbittorrent: false })),
    );
    setTotal(data.total);
    setPage(data.page);
  }

  async function addToQbittorrent(item: FeedItem) {
    const url = getAddableUrl(item);
    if (!url) {
      addToast({
        title: "No link",
        description: "This item has no magnet or torrent link to add.",
        severity: "warning",
      });
      return;
    }
    try {
      toggleSelectedItem(item, true);
      await fetchData<QbittorrentResponse>("/api/qbit/torrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ magnet: url }),
      });

      addToast({
        title: "Added to qBittorrent",
        description: item.title,
        severity: "success",
      });
    } catch (e) {
      addToast({
        title: "Add failed",
        description: e instanceof Error ? e.message : "Network error",
        severity: "danger",
      });
    } finally {
      toggleSelectedItem(item, false);
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const { title, indexers, sortBy } = formData;
    const titleQuery = title.trim();
    const indexersQuery = Array.from(indexers).join(",");
    const sortByQuery = sortBy;

    if (!titleQuery) {
      addToast({
        title: "Title is required",
        description: "Please enter a title to search for torrents.",
        severity: "warning",
      });
      return;
    }

    try {
      const searchParams = new URLSearchParams();
      searchParams.set("name", titleQuery);
      searchParams.set("indexers", indexersQuery);
      searchParams.set("sortBy", sortByQuery);
      const { data } = await fetchData<FeedResponse>(
        `/api/torrents/feed?${searchParams.toString()}`,
        { setIsLoading: setIsSearchLoading },
      );
      setItems(data.items.map((item) => ({ ...item, isAddingToQbittorrent: false })));
    } catch (e) {
      setItems([]);
    }
  }

  return (
    <>
      {isPageLoading && <LoadIndicator />}
      <main className="min-h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 p-3 bg-white/80 rounded-lg border border-stone-200"
        >
          <div>
            <Input
              type="text"
              label="Title"
              aria-labelledby="Search by title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoComplete="off"
            />
          </div>

          <div>
            <Select
              items={indexers}
              aria-labelledby="Indexers selection"
              label="Indexers"
              placeholder="All indexers"
              selectionMode="multiple"
              selectedKeys={formData.indexers}
              onSelectionChange={(selection) =>
                setFormData({
                  ...formData,
                  indexers: new Set(selection as string),
                })
              }
            >
              {(indexer) => (
                <SelectItem key={indexer.id}>{indexer.name}</SelectItem>
              )}
            </Select>
          </div>

          <div>
            <Select
              label="Sort by"
              selectedKeys={[formData.sortBy]}
              items={["Date", "Seeds", "Size"].map((sortBy) => ({
                label: sortBy,
                value: sortBy.toLowerCase(),
              }))}
              selectionMode="single"
              onSelectionChange={(selection) =>
                setFormData({
                  ...formData,
                  sortBy: (Array.from(selection)[0] as SortBy) ?? "date",
                })
              }
            >
              {(sortBy) => (
                <SelectItem key={sortBy.value}>{sortBy.label}</SelectItem>
              )}
            </Select>
          </div>

          <div className="flex w-full justify-center">
            <Button type="submit" color="primary" isLoading={isSearchLoading}>
              Search
            </Button>
          </div>
        </form>

        {hasSearched && (
          <Table
            aria-label="Torrents results"
            className="w-full text-left text-sm"
            bottomContent={
              total != null && total > limit ? (
                <div className="flex w-full justify-center">
                  <Pagination
                    total={Math.ceil(total / limit)}
                    page={page}
                    onChange={(p) => fetchPage(p)}
                    showControls
                  />
                </div>
              ) : null
            }
          >
            <TableHeader className="bg-stone-100 sticky top-0">
              <TableColumn>Title</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Size</TableColumn>
              <TableColumn>Seeds</TableColumn>
              <TableColumn>Leech</TableColumn>
              <TableColumn>Source</TableColumn>
              <TableColumn>Action</TableColumn>
            </TableHeader>

            <TableBody items={items} emptyContent={"No torrents found."}>
              {(item) => {
                const addUrl = getAddableUrl(item);
                const rowKey = `${item.link ?? item.magnet ?? ""}-${item.pubDateMs}-${item.title}`;
                return (
                  <TableRow key={rowKey}>
                    <TableCell
                      title={item.title}
                      className="max-w-[50%] truncate"
                    >
                      {item.title || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.pubDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.size ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.seeds ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.leech ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.source}
                    </TableCell>
                    <TableCell>
                      {addUrl && (
                        <Button
                          size="sm"
                          color="default"
                          variant="ghost"
                          isLoading={item.isAddingToQbittorrent}
                          onPress={() => addToQbittorrent(item)}
                        >
                          Add to qBittorrent
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        )}
      </main>
    </>
  );
}
