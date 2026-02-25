"use client";

import { useMemo, useState } from "react";
import { Button, Input, Select, SelectItem, addToast } from "@heroui/react";
import type {
  JackettIndexer,
  TorznabCategory,
} from "@/src/libs/torrents/jackett";
import { SortBy, type FeedItem } from "@/src/libs/torrents/feed-format";
import useFetch from "../../hooks/use-fetch";
import { FeedResponse } from "../api/torrents/feed/route";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import TorrentResults from "@/src/components/torrents/TorrentResults";
import {
  TORRENT_DEFAULT_CATEGORIES,
  TORRENT_SORT_BY,
  TORRENT_SORT_ORDER,
} from "@/src/config";

type FormData = {
  title: string;
  indexer: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  category: string;
  limit: number;
};

type TorrentsClientProps = {
  indexers: JackettIndexer[];
};

export default function TorrentsClient({ indexers }: TorrentsClientProps) {
  const { fetchData } = useFetch();
  const { isOpen, toggle } = useAccordion();

  const [formData, setFormData] = useState<FormData>(() => ({
    title: "",
    indexer: "",
    sortBy: "date" as SortBy,
    sortOrder: "desc" as "asc" | "desc",
    category: "",
    limit: NaN,
  }));

  const [items, setItems] = useState<FeedItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const categories: TorznabCategory[] = useMemo(() => {
    const indexer = indexers.find((i) => i.id === formData.indexer);
    if (!indexer) return TORRENT_DEFAULT_CATEGORIES;

    return indexer.categories;
  }, [formData.indexer, indexers]);

  function handleInputFocus() {
    if (!isOpen) toggle();
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const { indexer, sortBy, sortOrder, category, limit } = formData;
    const title = formData.title.trim();

    if (!title && !category) {
      addToast({
        title: "Title or category is required",
        description: "Please enter a title to search for torrents.",
        severity: "warning",
      });
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        name: title || "*", // Default to wildcard search if no title is provided
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
              aria-label="Search by title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoComplete="off"
              onFocus={handleInputFocus}
            />
          </div>

          {/* Accordion */}
          <Accordion isOpen={isOpen}>
            <div className="flex flex-col gap-2">
              {/* Indexers select */}
              <div>
                <Select
                  items={indexers}
                  aria-label="Indexers selection"
                  label="Indexers"
                  placeholder="All indexers"
                  selectionMode="single"
                  selectedKeys={[formData.indexer]}
                  onSelectionChange={(selection) => {
                    const id = [...selection][0]?.toString() ?? "";
                    const indexer = indexers.find((i) => i.id === id);
                    setFormData((prev) => ({
                      ...prev,
                      indexer: id,
                      category: "",
                      limit: indexer?.limit ?? NaN,
                    }));
                  }}
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
                  {TORRENT_SORT_BY.map((sortBy) => (
                    <SelectItem key={sortBy}>{sortBy}</SelectItem>
                  ))}
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
                  {TORRENT_SORT_ORDER.map((sortOrder) => (
                    <SelectItem key={sortOrder}>{sortOrder}</SelectItem>
                  ))}
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
              className="w-32 shadow-btn disabled:opacity-50"
              type="submit"
              color="primary"
              isLoading={isSearchLoading}
            >
              Search
            </Button>

            {/* Accordion button */}
            <AccordionButton isOpen={isOpen} onToggle={toggle} />
          </div>
        </form>

        <TorrentResults items={items} hasSearched={hasSearched} />
      </main>
    </>
  );
}
