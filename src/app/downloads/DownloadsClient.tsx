"use client";

import { useMemo, useState } from "react";
import type { JackettIndexer } from "@/src/libs/downloads/jackett";
import { SortBy, type FeedItem } from "@/src/libs/downloads/feed-format";
import useFetch from "../../hooks/use-fetch";
import { FeedResponse } from "../api/downloads/feed/route";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import DownloadResults from "@/src/components/downloads/DownloadResults";
import {
  DOWNLOAD_DEFAULT_CATEGORIES,
  DOWNLOAD_SORT_BY,
  DOWNLOAD_SORT_ORDER,
} from "@/src/config";
import { useToast } from "@/src/providers/ToastProvider";
import Input from "@/src/components/ui/Input";
import SelectInput from "@/src/components/ui/SelectInput";
import Button from "@/src/components/ui/Button";

type FormData = {
  title: string;
  indexer: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  category: string;
  limit: number | null;
};

type DownloadsClientProps = {
  indexers: JackettIndexer[];
};

export default function DownloadsClient({ indexers }: DownloadsClientProps) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const { isOpen, toggle } = useAccordion();

  const [formData, setFormData] = useState<FormData>(() => ({
    title: "",
    indexer: "",
    sortBy: "date" as SortBy,
    sortOrder: "desc" as "asc" | "desc",
    category: "",
    limit: null,
  }));

  const [items, setItems] = useState<FeedItem[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const categories = useMemo(() => {
    const indexer = indexers.find((i) => i.id === formData.indexer);
    let categories = DOWNLOAD_DEFAULT_CATEGORIES;
    if (indexer) {
      categories = indexer.categories;
    }

    return categories.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [formData.indexer, indexers]);

  const indexerOptions = useMemo(() => {
    return indexers.map((indexer) => ({
      value: indexer.id,
      label: indexer.name,
    }));
  }, [indexers]);

  const sortOptions = useMemo(() => {
    return DOWNLOAD_SORT_BY.map((sortBy) => ({
      value: sortBy,
      label: sortBy,
    }));
  }, []);

  const sortOrderOptions = useMemo(() => {
    return DOWNLOAD_SORT_ORDER.map((sortOrder) => ({
      value: sortOrder,
      label: sortOrder,
    }));
  }, []);

  function handleInputFocus() {
    if (!isOpen) toggle();
  }

  function handleIndexerChange(id: string) {
    const indexer = indexers.find((i) => i.id === id);
    setFormData((prev) => ({
      ...prev,
      indexer: id,
      category: "",
      limit: indexer?.limit ?? null,
    }));
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const { indexer, sortBy, sortOrder, category, limit } = formData;
    const title = formData.title.trim();

    if (!title && !category) {
      toast.warning(
        "Title or category is required, please enter a title to search for torrents.",
      );
      return;
    }

    try {
      const searchParams = new URLSearchParams({
        name: title || "*",
        indexers: indexer,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      if (category) searchParams.set("category", category);
      if (limit != null && limit > 0) searchParams.set("limit", String(limit));
      const { data } = await fetchData<FeedResponse>(
        `/api/downloads/feed?${searchParams.toString()}`,
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
      <main className="container-main h-full w-full flex flex-col gap-4 p-4 pb-8 overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 p-3 bg-white/80 rounded-lg border border-stone-200"
        >
          {/* Title input */}
          <div>
            <Input
              id="title"
              label="Title"
              aria-label="Search by title"
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
              autoComplete="off"
              onFocus={handleInputFocus}
            />
          </div>

          {/* Accordion */}
          <Accordion isOpen={isOpen}>
            <div className="flex flex-col gap-2">
              {/* Indexers select */}
              <SelectInput
                id="indexer"
                options={indexerOptions}
                aria-label="Indexers selection"
                label="Indexers"
                placeholder="All indexers"
                value={new Set([formData.indexer])}
                onChange={(value) =>
                  handleIndexerChange(([...value][0] as string) ?? "")
                }
              />
              {/* Sort by select */}
              <div className="flex gap-2">
                <SelectInput
                  id="sortBy"
                  className="basis-3/5"
                  label="Sort by"
                  value={new Set([formData.sortBy])}
                  options={sortOptions}
                  onChange={(selection) =>
                    setFormData((prev) => {
                      const sortBy = Array.from(selection)[0];
                      if (!sortBy) return prev;
                      return { ...prev, sortBy: sortBy as SortBy };
                    })
                  }
                />
                <SelectInput
                  id="sortOrder"
                  className="basis-2/5"
                  label="Order"
                  value={new Set([formData.sortOrder])}
                  options={sortOrderOptions}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder:
                        ([...value][0] as "asc" | "desc") || prev.sortOrder,
                    }))
                  }
                />
              </div>

              {/* Category select */}
              {categories.length > 0 && (
                <div>
                  <SelectInput
                    id="category"
                    label="Category"
                    value={new Set([formData.category])}
                    options={categories}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: ([...value][0] as string) ?? "",
                      }))
                    }
                    isClearable
                  />
                </div>
              )}
            </div>
          </Accordion>

          {/* Search button */}
          <div className="pt-4 flex w-full justify-center gap-2">
            <Button
              className="w-44 shadow-btn"
              type="submit"
              color="primary"
              isLoading={isSearchLoading}
              size="large"
            >
              Search
            </Button>

            {/* Accordion button */}
            <AccordionButton isOpen={isOpen} onToggle={toggle} />
          </div>
        </form>

        <DownloadResults items={items} hasSearched={hasSearched} />
      </main>
    </>
  );
}
