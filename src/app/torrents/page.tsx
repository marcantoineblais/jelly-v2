"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Input,
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
import type {
  JackettIndexer,
  TorznabCategory,
} from "@/src/libs/torrents/jackett";
import {
  formatDate,
  SortBy,
  type FeedItem,
} from "@/src/libs/torrents/feed-format";
import useFetch from "../../hooks/use-fetch";
import { JackettIndexerResponse } from "../api/torrents/indexers/route";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import { FeedResponse } from "../api/torrents/feed/route";
import { CapsResponse } from "../api/torrents/caps/route";
import { log } from "@/src/libs/logger";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";

type FormData = {
  title: string;
  indexer: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  category: string;
  limit: number;
};

export default function TorrentsPage() {
  const { fetchData } = useFetch();
  const { isOpen, toggle } = useAccordion();

  // Form states
  const [formData, setFormData] = useState<FormData>({
    title: "",
    indexer: "",
    sortBy: "date",
    sortOrder: "desc",
    category: "",
    limit: NaN,
  });

  // Data states
  const [items, setItems] = useState<
    (FeedItem & { isAddingToQbittorrent: boolean })[]
  >([]);
  const [indexers, setIndexers] = useState<JackettIndexer[]>([]);

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [categories, setCategories] = useState<TorznabCategory[]>([]);
  const [limits, setLimits] = useState<number>(NaN);

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
  }, [fetchData]);

  useEffect(() => {
    if (!formData.indexer) {
      setCategories([]);
      setLimits(NaN);
      setFormData({ ...formData, category: "", limit: NaN });
      return;
    }

    const fetchCategories = async () => {
      const { data } = await fetchData<CapsResponse>("/api/torrents/caps");
      setCategories(data.caps.categories);
      setFormData({ ...formData, limit: data.caps.limits?.max ?? NaN });
    };

    fetchCategories();
  }, [fetchData, formData.indexer]);

  function toggleSelectedItem(item: FeedItem, state: boolean) {
    setItems((prevItems) =>
      prevItems.map((prevItem) => {
        if (prevItem.id === item.id) {
          return { ...prevItem, isAddingToQbittorrent: state };
        }

        return prevItem;
      }),
    );
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
    const body = { url: item.url };
    try {
      toggleSelectedItem(item, true);
      await fetchData<QbittorrentResponse>("/api/qbit/torrents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    const { title, indexer, sortBy, sortOrder, category, limit } = formData;

    if (!title.trim()) {
      addToast({
        title: "Title is required",
        description: "Please enter a title to search for torrents.",
        severity: "warning",
      });
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        name: title.trim(),
        indexers: indexer,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      if (category) searchParams.set("category", category);
      if (Number.isFinite(limit) && limit > 0)
        searchParams.set("limit", String(limit));
      const { data } = await fetchData<FeedResponse>(
        `/api/torrents/feed?${searchParams.toString()}`,
        { setIsLoading: setIsSearchLoading },
      );
      setItems(
        data.items.map((item) => ({ ...item, isAddingToQbittorrent: false })),
      );
      if (isOpen) toggle();
    } catch {
      setItems([]);
    }

    setHasSearched(true);
  }

  return (
    <>
      <main className="h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8 overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 p-3 bg-white/80 rounded-lg border border-stone-200"
        >
          {/* Title input */}
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
              onFocus={toggle}
            />
          </div>

          {/* Accordion */}
          <Accordion isOpen={isOpen}>
            <div className="flex flex-col gap-2">
              {/* Indexers select */}
              <div>
                <Select
                  items={indexers}
                  aria-labelledby="Indexers selection"
                  label="Indexers"
                  placeholder="All indexers"
                  selectionMode="single"
                  selectedKeys={[formData.indexer]}
                  onSelectionChange={(selection) =>
                    setFormData({
                      ...formData,
                      indexer: [...selection][0]?.toString() ?? "",
                    })
                  }
                >
                  {(indexer) => (
                    <SelectItem key={indexer.id}>{indexer.name}</SelectItem>
                  )}
                </Select>
              </div>

              {/* Sort by select */}
              <div className="flex gap-2">
                <Select
                  className="basis-3/5"
                  label="Sort by"
                  selectedKeys={[formData.sortBy]}
                  selectionMode="single"
                  onSelectionChange={(selection) =>
                    setFormData((prev) => {
                      const sortBy = Array.from(selection)[0];
                      if (!sortBy) return prev;
                      return { ...prev, sortBy: sortBy as SortBy };
                    })
                  }
                >
                  <SelectItem key="date">Date</SelectItem>
                  <SelectItem key="seeds">Seeds</SelectItem>
                  <SelectItem key="size">Size</SelectItem>
                </Select>
                <Select
                  className="basis-2/5"
                  label="Order"
                  selectionMode="single"
                  selectedKeys={[formData.sortOrder]}
                  onSelectionChange={(selection) =>
                    setFormData((prev) => {
                      const sortOrder = Array.from(selection)[0];
                      if (!sortOrder) return prev;
                      return {
                        ...prev,
                        sortOrder: sortOrder as "asc" | "desc",
                      };
                    })
                  }
                >
                  <SelectItem key="asc">Ascending</SelectItem>
                  <SelectItem key="desc">Descending</SelectItem>
                </Select>
              </div>

              {/* Category select */}
              {categories.length > 0 && (
                <div>
                  <Select
                    label="Category"
                    items={categories}
                    selectionMode="single"
                    selectedKeys={[formData.category]}
                    onSelectionChange={(selection) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: [...selection][0]?.toString() ?? "",
                      }))
                    }
                  >
                    {(category) => (
                      <SelectItem key={category.id}>{category.name}</SelectItem>
                    )}
                  </Select>
                </div>
              )}
            </div>
          </Accordion>

          {/* Search button */}
          <div className="flex w-full justify-center gap-2">
            <Button
              type="submit"
              color="primary"
              isLoading={isSearchLoading}
              disabled={isPageLoading}
            >
              Search
            </Button>

            {/* Accordion button */}
            <AccordionButton isOpen={isOpen} onToggle={toggle} />
          </div>
        </form>

        {hasSearched && (
          <Table
            aria-label="Torrents results"
            className="h-full w-full text-left text-sm overflow-y-auto"
          >
            <TableHeader className="bg-stone-100 sticky top-0">
              <TableColumn>Title</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Size</TableColumn>
              <TableColumn>Seeds</TableColumn>
              <TableColumn>Leech</TableColumn>
              <TableColumn>Action</TableColumn>
            </TableHeader>

            <TableBody items={items} emptyContent={"No torrents found."}>
              {(item) => {
                return (
                  <TableRow key={item.id.toString()}>
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
                    <TableCell>
                      <Button
                        size="sm"
                        color="default"
                        variant="ghost"
                        isLoading={item.isAddingToQbittorrent}
                        onPress={() => addToQbittorrent(item)}
                      >
                        Add to qBittorrent
                      </Button>
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
