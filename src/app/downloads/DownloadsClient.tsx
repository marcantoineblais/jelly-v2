"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClockRotateLeft,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { JackettIndexer } from "@/src/libs/downloads/jackett";
import { SortBy, type FeedItem } from "@/src/libs/downloads/feed-format";
import useFetch from "../../hooks/use-fetch";
import usePersistentState from "@/src/hooks/use-persistent-state";
import { FeedResponse } from "../api/downloads/feed/route";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import DownloadResults from "@/src/components/downloads/DownloadResults";
import SearchStatus from "@/src/components/downloads/SearchStatus";
import {
  DOWNLOAD_DEFAULT_CATEGORIES,
  DOWNLOAD_SORT_BY,
  DOWNLOAD_SORT_ORDER,
} from "@/src/config";
import { useToast } from "@/src/providers/ToastProvider";
import { isAbortError } from "@/src/libs/fetch-error";
import RelativeTime from "@/src/components/ui/RelativeTime";
import Input from "@/src/components/ui/Input";
import SelectInput from "@/src/components/ui/SelectInput";
import Button from "@/src/components/ui/Button";
import PageHeader from "@/src/components/ui/PageHeader";
import IconButton from "@/src/components/ui/IconButton";

type FormData = {
  title: string;
  indexer: string;
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  category: string;
  limit: number | null;
};

type LastSearch = {
  items: FeedItem[];
  query: string;
  indexerName: string;
  searchedAt: number;
};

const EMPTY_FORM: FormData = {
  title: "",
  indexer: "",
  sortBy: "date",
  sortOrder: "desc",
  category: "",
  limit: null,
};

type DownloadsClientProps = {
  indexers: JackettIndexer[];
};

export default function DownloadsClient({ indexers }: DownloadsClientProps) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const { isOpen, toggle } = useAccordion();

  const [formData, setFormData] = usePersistentState<FormData>(
    "downloads:form",
    EMPTY_FORM,
  );
  const [lastSearch, setLastSearch, clearLastSearch] =
    usePersistentState<LastSearch | null>("downloads:last-search", null);

  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel any in-flight search when leaving the page
  useEffect(() => () => abortRef.current?.abort(), []);

  const categories = useMemo(() => {
    const indexer = indexers.find((i) => i.id === formData.indexer);
    const list = indexer ? indexer.categories : DOWNLOAD_DEFAULT_CATEGORIES;
    return list.map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [formData.indexer, indexers]);

  const indexerOptions = useMemo(
    () =>
      indexers.map((indexer) => ({ value: indexer.id, label: indexer.name })),
    [indexers],
  );

  const sortOptions = useMemo(
    () => DOWNLOAD_SORT_BY.map((sortBy) => ({ value: sortBy, label: sortBy })),
    [],
  );

  const sortOrderOptions = useMemo(
    () =>
      DOWNLOAD_SORT_ORDER.map((sortOrder) => ({
        value: sortOrder,
        label: sortOrder === "asc" ? "Ascending" : "Descending",
      })),
    [],
  );

  const activeFilters =
    (formData.indexer ? 1 : 0) +
    (formData.category ? 1 : 0) +
    (formData.sortBy !== EMPTY_FORM.sortBy ||
    formData.sortOrder !== EMPTY_FORM.sortOrder
      ? 1
      : 0);

  function handleIndexerChange(id: string) {
    const indexer = indexers.find((i) => i.id === id);
    setFormData((prev) => ({
      ...prev,
      indexer: id,
      category: "",
      limit: indexer?.limit ?? null,
    }));
  }

  function handleCancel() {
    abortRef.current?.abort();
    abortRef.current = null;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSearchLoading) return;

    const { indexer, sortBy, sortOrder, category, limit } = formData;
    const title = formData.title.trim();

    if (!title && !category) {
      toast.warning("Enter a title or pick a category to search.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const searchParams = new URLSearchParams({
        name: title || "*",
        indexers: indexer,
        sortBy,
        sortOrder,
      });
      if (category) searchParams.set("category", category);
      if (limit != null && limit > 0) searchParams.set("limit", String(limit));

      const { data } = await fetchData<FeedResponse>(
        `/api/downloads/feed?${searchParams.toString()}`,
        { setIsLoading: setIsSearchLoading, signal: controller.signal },
      );

      const categoryName = categories.find((c) => c.value === category)?.label;
      setLastSearch({
        items: data.items,
        query: title || categoryName || "*",
        indexerName:
          indexers.find((i) => i.id === indexer)?.name ?? "All indexers",
        searchedAt: Date.now(),
      });
      if (isOpen) toggle();
    } catch (err) {
      if (isAbortError(err)) {
        toast.info("Search cancelled");
        return;
      }
      setLastSearch({
        items: [],
        query: title,
        indexerName: "",
        searchedAt: Date.now(),
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  return (
    <main className="container-main h-full w-full flex flex-col gap-4 px-4 pt-6 overflow-hidden">
      <PageHeader
        title="Search"
        subtitle={`Find torrents across ${indexers.length || "your"} indexer${indexers.length === 1 ? "" : "s"}`}
      />

      <form
        onSubmit={handleSubmit}
        className="card p-3 flex flex-col gap-3 shrink-0 animate-fade-in-up"
      >
        <div className="flex gap-2">
          <div className="relative grow min-w-0">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted z-10"
            />
            <Input
              id="title"
              aria-label="Search by title"
              placeholder="Search by title…"
              value={formData.title}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, title: value }))
              }
              autoComplete="off"
              isClearable
              className="[&_input]:pl-10 [&_input]:min-w-0"
            />
          </div>
          <AccordionButton
            isOpen={isOpen}
            onToggle={toggle}
            label="Filters"
            badge={activeFilters}
          />
        </div>

        <Accordion isOpen={isOpen}>
          <div className="grid grid-cols-2 gap-2 pb-1">
            <SelectInput
              id="indexer"
              className="col-span-2 sm:col-span-1"
              options={indexerOptions}
              label="Indexer"
              placeholder="All indexers"
              value={new Set([formData.indexer])}
              onChange={(value) =>
                handleIndexerChange(([...value][0] as string) ?? "")
              }
              isClearable
            />
            {categories.length > 0 && (
              <SelectInput
                id="category"
                className="col-span-2 sm:col-span-1"
                label="Category"
                placeholder="Any category"
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
            )}
            <SelectInput
              id="sortBy"
              label="Sort by"
              className="min-w-0"
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
              className="min-w-0"
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
        </Accordion>

        {isSearchLoading ? (
          <Button
            key="cancel"
            type="button"
            color="default"
            className="w-full"
            onClick={(e) => {
              // Prevent the click from submitting once the button re-renders
              e.preventDefault();
              handleCancel();
            }}
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
            Cancel search
          </Button>
        ) : (
          <Button key="submit" type="submit" color="primary" className="w-full">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
            Search
          </Button>
        )}
      </form>

      {isSearchLoading ? (
        <SearchStatus onCancel={handleCancel} />
      ) : (
        lastSearch && (
          <div className="flex items-center justify-between gap-3 text-xs text-text-muted shrink-0 animate-fade-in">
            <span className="min-w-0 truncate">
              <FontAwesomeIcon
                icon={faClockRotateLeft}
                className="mr-1.5 text-[10px]"
              />
              <span className="text-text-secondary font-medium tabular-nums">
                {lastSearch.items.length}
              </span>{" "}
              result{lastSearch.items.length === 1 ? "" : "s"} for{" "}
              <span className="text-text-secondary">“{lastSearch.query}”</span>
              {lastSearch.indexerName && ` · ${lastSearch.indexerName}`} ·{" "}
              <RelativeTime timestamp={lastSearch.searchedAt} />
            </span>
            <IconButton
              icon={faXmark}
              ariaLabel="Clear results"
              size="sm"
              onClick={clearLastSearch}
              className="size-7 rounded-lg flex items-center justify-center hover:bg-surface-hover shrink-0"
            />
          </div>
        )
      )}

      <div
        data-loading={isSearchLoading || undefined}
        className="flex-1 min-h-0 flex flex-col transition-opacity duration-300 data-loading:opacity-40 data-loading:pointer-events-none"
      >
        <DownloadResults
          items={lastSearch?.items ?? []}
          hasSearched={lastSearch != null}
        />
      </div>
    </main>
  );
}
