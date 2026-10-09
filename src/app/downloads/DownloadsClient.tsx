"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClockRotateLeft,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { JackettIndexer } from "@/src/libs/downloads/jackett";
import type { FeedItem, SortBy } from "@/src/libs/downloads/feed-format";
import usePersistentState from "@/src/hooks/use-persistent-state";
import useFeedSearch from "@/src/hooks/use-feed-search";
import { useSession } from "@/src/providers/session-provider-client";
import type { SessionData } from "@/src/providers/session-provider";
import { useToast } from "@/src/providers/ToastProvider";
import {
  DOWNLOAD_DEFAULT_CATEGORIES,
  DOWNLOAD_SORT_BY,
  DOWNLOAD_SORT_ORDER,
} from "@/src/config";
import DownloadResults from "@/src/components/downloads/DownloadResults";
import SearchStatus from "@/src/components/downloads/SearchStatus";
import Collapse from "@/src/components/ui/Collapse";
import DisclosureButton from "@/src/components/ui/DisclosureButton";
import RelativeTime from "@/src/components/ui/RelativeTime";
import Input from "@/src/components/ui/Input";
import SelectInput from "@/src/components/ui/SelectInput";
import Button from "@/src/components/ui/Button";
import PageHeader from "@/src/components/ui/PageHeader";
import IconButton from "@/src/components/ui/IconButton";

type Filters = Required<NonNullable<SessionData["downloads"]>>;

const DEFAULT_FILTERS: Filters = {
  indexer: "",
  category: "",
  sortBy: "date",
  sortOrder: "desc",
};

type LastSearch = {
  items: FeedItem[];
  query: string;
  indexerName: string;
  searchedAt: number;
};

type DownloadsClientProps = {
  indexers: JackettIndexer[];
};

export default function DownloadsClient({ indexers }: DownloadsClientProps) {
  const toast = useToast();
  const { session, updateSession } = useSession();
  const { search, cancel, isSearching } = useFeedSearch();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filters are user preferences (saved in the session); the typed title and
  // the last results are kept in this browser.
  const filters: Filters = { ...DEFAULT_FILTERS, ...session.downloads };
  const [title, setTitle] = usePersistentState("downloads:title", "");
  const [lastSearch, setLastSearch, clearLastSearch] =
    usePersistentState<LastSearch | null>("downloads:last-search", null);

  const selectedIndexer = indexers.find((i) => i.id === filters.indexer);

  function updateFilters(patch: Partial<Filters>) {
    updateSession({ downloads: { ...filters, ...patch } });
  }

  const categoryOptions = useMemo(
    () =>
      (selectedIndexer?.categories ?? DOWNLOAD_DEFAULT_CATEGORIES).map(
        (category) => ({ value: category.id, label: category.name }),
      ),
    [selectedIndexer],
  );

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

  const activeFilterCount =
    (filters.indexer ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.sortBy !== DEFAULT_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder
      ? 1
      : 0);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSearching) return;

    const query = title.trim();
    const { indexer, category, sortBy, sortOrder } = filters;

    if (!query && !category) {
      toast.warning("Enter a title or pick a category to search.");
      return;
    }

    const params = new URLSearchParams({
      name: query || "*",
      indexers: indexer,
      sortBy,
      sortOrder,
    });
    if (category) params.set("category", category);
    if (selectedIndexer?.limit)
      params.set("limit", String(selectedIndexer.limit));

    const items = await search(params);
    if (items === null) return;

    setLastSearch({
      items,
      query:
        query ||
        categoryOptions.find((c) => c.value === category)?.label ||
        "*",
      indexerName: selectedIndexer?.name ?? "All indexers",
      searchedAt: Date.now(),
    });
    setIsFiltersOpen(false);
  }

  return (
    <main className="container-main h-full w-full flex flex-col gap-4 px-4 pt-6 overflow-hidden">
      <PageHeader
        title="Downloads"
        subtitle={`Search torrents across ${indexers.length || "your"} indexer${indexers.length === 1 ? "" : "s"}`}
      />

      <form
        onSubmit={handleSubmit}
        className="card p-3 flex flex-col gap-3 shrink-0"
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
              value={title}
              onChange={setTitle}
              // Picking an indexer is part of almost every search
              onFocus={() => setIsFiltersOpen(true)}
              autoComplete="off"
              isClearable
              className="[&_input]:pl-10 [&_input]:min-w-0"
            />
          </div>
          <DisclosureButton
            isOpen={isFiltersOpen}
            onToggle={() => setIsFiltersOpen((open) => !open)}
            label="Filters"
            badge={activeFilterCount}
          />
        </div>

        <Collapse isOpen={isFiltersOpen} className="-mx-1 px-1">
          <div className="grid grid-cols-2 gap-2 pb-1">
            <SelectInput
              id="indexer"
              className="col-span-2 sm:col-span-1"
              options={indexerOptions}
              label="Indexer"
              placeholder="All indexers"
              value={new Set([filters.indexer])}
              onChange={(value) =>
                updateFilters({ indexer: [...value][0] ?? "", category: "" })
              }
              isClearable
            />
            {categoryOptions.length > 0 && (
              <SelectInput
                id="category"
                className="col-span-2 sm:col-span-1"
                label="Category"
                placeholder="Any category"
                value={new Set([filters.category])}
                options={categoryOptions}
                onChange={(value) =>
                  updateFilters({ category: [...value][0] ?? "" })
                }
                isClearable
              />
            )}
            <SelectInput
              id="sortBy"
              label="Sort by"
              className="min-w-0"
              value={new Set([filters.sortBy])}
              options={sortOptions}
              onChange={(value) => {
                const sortBy = [...value][0];
                if (sortBy) updateFilters({ sortBy: sortBy as SortBy });
              }}
            />
            <SelectInput
              id="sortOrder"
              className="min-w-0"
              label="Order"
              value={new Set([filters.sortOrder])}
              options={sortOrderOptions}
              onChange={(value) => {
                const sortOrder = [...value][0] as "asc" | "desc" | undefined;
                if (sortOrder) updateFilters({ sortOrder });
              }}
            />
          </div>
        </Collapse>

        {isSearching ? (
          <Button
            key="cancel"
            type="button"
            color="default"
            className="w-full"
            onClick={(e) => {
              // The button turns into "submit" on re-render; don't let this
              // click submit the form again.
              e.preventDefault();
              cancel();
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

      {isSearching ? (
        <SearchStatus />
      ) : (
        lastSearch && (
          <div className="flex items-center justify-between gap-3 text-xs text-text-muted shrink-0">
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
              {` · ${lastSearch.indexerName} · `}
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
        data-loading={isSearching || undefined}
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
