"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  addToast,
  useDisclosure,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { TrackedShow } from "@/src/types/TrackedShow";
import type { JackettIndexer } from "@/src/libs/torrents/jackett";
import type { FeedItem } from "@/src/libs/torrents/feed-format";
import type { CheckShowResponse } from "../api/shows/[id]/check/route";
import type { FeedResponse } from "../api/torrents/feed/route";
import { TORRENT_DEFAULT_CATEGORIES } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";
import TorrentResults from "@/src/components/torrents/TorrentResults";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import { LibraryFoldersResponse } from "../api/shows/libraries/[name]/folders/route";

type ShowFormData = {
  title: string;
  season: string;
  library: string;
  searchQuery: string;
  indexer: string;
  category: string;
};

const EMPTY_FORM: ShowFormData = {
  title: "",
  season: "1",
  library: "",
  searchQuery: "",
  indexer: "",
  category: "",
};

type ShowsClientProps = {
  initialShows: TrackedShow[];
  libraries: { name: string; path: string }[];
  indexers: JackettIndexer[];
};

function showToFormData(show: TrackedShow): ShowFormData {
  return {
    title: show.title,
    season: String(show.season),
    library: show.library,
    searchQuery: show.searchQuery ?? "",
    indexer: show.indexer ?? "",
    category: show.category ?? "",
  };
}

export default function ShowsClient({
  initialShows,
  libraries,
  indexers,
}: ShowsClientProps) {
  const { fetchData } = useFetch();
  const { isOpen: isAccordionOpen, toggle: toggleAccordion } = useAccordion();

  const [shows, setShows] = useState<TrackedShow[]>(initialShows);
  const [selectedShowId, setSelectedShowId] = useState("");

  const [isSearchDisabled, setIsSearchDisabled] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextEpisode, setNextEpisode] = useState<{
    season: number;
    episode: number;
    query: string;
  } | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);

  const [formData, setFormData] = useState<ShowFormData>(EMPTY_FORM);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [libraryFolders, setLibraryFolders] = useState<string[]>([]);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [deletingShow, setDeletingShow] = useState<TrackedShow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedShow = shows.find((s) => s.id === selectedShowId);

  const categories = useMemo(() => {
    const indexer = indexers.find((i) => i.id === formData.indexer);
    return indexer ? indexer.categories : TORRENT_DEFAULT_CATEGORIES;
  }, [formData.indexer, indexers]);

  const fetchFolders = useCallback(
    async (libraryName: string) => {
      if (!libraryName) {
        setLibraryFolders([]);
        return;
      }
      try {
        const { data } = await fetchData<LibraryFoldersResponse>(
          `/api/shows/libraries/${encodeURIComponent(libraryName)}/folders`,
        );
        setLibraryFolders(data.folders);
      } catch {
        setLibraryFolders([]);
      }
    },
    [fetchData],
  );

  const fetchEpisode = useCallback(
    async (showId: string) => {
      try {
        const { data } = await fetchData<CheckShowResponse>(
          `/api/shows/${showId}/check`,
          { setIsLoading: setIsSearchDisabled },
        );
        setNextEpisode(data.nextEpisode ?? null);
      } catch {
        setNextEpisode(null);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    if (!isAccordionOpen) return;
    startTransition(() => {
      if (selectedShow) {
        setFormData(showToFormData(selectedShow));
        fetchFolders(selectedShow.library);
      } else {
        setFormData(EMPTY_FORM);
        setLibraryFolders([]);
      }
    });
  }, [selectedShow, isAccordionOpen, fetchFolders]);

  useEffect(() => {
    if (!selectedShowId) {
      setNextEpisode(null);
      return;
    }
    fetchEpisode(selectedShowId);
  }, [selectedShowId, fetchEpisode]);

  async function handleSearch() {
    if (!selectedShow || !nextEpisode) return;

    const query = selectedShow.searchQuery || nextEpisode.query;
    const params = new URLSearchParams({
      name: query,
      indexers: selectedShow.indexer || "",
      sortBy: "date",
      sortOrder: "desc",
    });
    if (selectedShow.category) params.set("category", selectedShow.category);

    try {
      const { data } = await fetchData<FeedResponse>(
        `/api/torrents/feed?${params}`,
        { setIsLoading: setIsSearchLoading },
      );
      setItems(data.items);
    } catch {
      setItems([]);
    }
    setHasSearched(true);
  }

  async function handleAdd() {
    const title = formData.title.trim();
    const library = formData.library.trim();
    const season = parseInt(formData.season, 10);
    if (!title) {
      addToast({ title: "Title is required", severity: "warning" });
      return;
    }
    if (!library) {
      addToast({ title: "Library is required", severity: "warning" });
      return;
    }
    if (!Number.isInteger(season) || season < 1) {
      addToast({
        title: "Season must be a positive number",
        severity: "warning",
      });
      return;
    }

    const payload = {
      title,
      season,
      library,
      searchQuery: formData.searchQuery.trim() || undefined,
      indexer: formData.indexer || undefined,
      category: formData.category || undefined,
    };

    try {
      const { data } = await fetchData<{ ok: boolean; show: TrackedShow }>(
        "/api/shows",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          setIsLoading: setIsFormSubmitting,
        },
      );
      setShows((prev) => [...prev, data.show]);
      setFormData(EMPTY_FORM);
      setLibraryFolders([]);
      toggleAccordion();
      addToast({ title: "Show added", severity: "success" });
    } catch {
      /* useFetch shows error toast */
    }
  }

  async function handleUpdate() {
    if (!selectedShow) return;
    const title = formData.title.trim();
    const library = formData.library.trim();
    const season = parseInt(formData.season, 10);
    if (!title) {
      addToast({ title: "Title is required", severity: "warning" });
      return;
    }
    if (!library) {
      addToast({ title: "Library is required", severity: "warning" });
      return;
    }
    if (!Number.isInteger(season) || season < 1) {
      addToast({
        title: "Season must be a positive number",
        severity: "warning",
      });
      return;
    }

    const payload = {
      title,
      season,
      library,
      searchQuery: formData.searchQuery.trim() || undefined,
      indexer: formData.indexer || undefined,
      category: formData.category || undefined,
    };

    try {
      const { data } = await fetchData<{ ok: boolean; show: TrackedShow }>(
        `/api/shows/${selectedShow.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          setIsLoading: setIsFormSubmitting,
        },
      );
      setShows((prev) =>
        prev.map((s) => (s.id === selectedShow.id ? data.show : s)),
      );
      toggleAccordion();
      fetchEpisode(selectedShow.id);
      addToast({ title: "Show updated", severity: "success" });
    } catch {
      /* useFetch shows error toast */
    }
  }

  function handleDeleteClick() {
    if (!selectedShow) return;
    setDeletingShow(selectedShow);
    onDeleteOpen();
  }

  async function handleDeleteConfirm() {
    if (!deletingShow) return;
    try {
      await fetchData(`/api/shows/${deletingShow.id}`, {
        method: "DELETE",
        setIsLoading: setIsDeleting,
      });
      setShows((prev) => prev.filter((s) => s.id !== deletingShow.id));
      if (selectedShowId === deletingShow.id) {
        setSelectedShowId("");
        setHasSearched(false);
        setItems([]);
        setNextEpisode(null);
      }
      addToast({ title: "Show removed", severity: "success" });
    } catch {
      /* useFetch shows error toast */
    }
    onDeleteClose();
    setTimeout(() => setDeletingShow(null), 200);
  }

  function mainButton() {
    if (isAccordionOpen) {
      if (selectedShow) {
        return (
          <Button
            className="w-32"
            color="primary"
            isLoading={isFormSubmitting}
            onPress={handleUpdate}
          >
            Update
          </Button>
        );
      }
      return (
        <Button
          className="w-32"
          color="primary"
          isLoading={isFormSubmitting}
          onPress={handleAdd}
        >
          Add
        </Button>
      );
    }
    return (
      <Button
        className="w-32"
        color="primary"
        isLoading={isSearchLoading}
        isDisabled={!selectedShow || isSearchDisabled}
        onPress={handleSearch}
      >
        Search
      </Button>
    );
  }

  return (
    <>
      <main className="h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8 overflow-hidden">
        <div className="flex flex-col gap-2 p-3 bg-white/80 rounded-lg border border-stone-200">
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                label="Show"
                placeholder="Select a show"
                selectedKeys={selectedShowId ? [selectedShowId] : []}
                selectionMode="single"
                onSelectionChange={(selection) =>
                  setSelectedShowId([...selection][0]?.toString() ?? "")
                }
                endContent={
                  nextEpisode ? (
                    <span>
                      S{String(nextEpisode.season).padStart(2, "0")}E
                      {String(nextEpisode.episode).padStart(2, "0")}
                    </span>
                  ) : null
                }
              >
                {shows.map((show) => (
                  <SelectItem key={show.id}>{show.title}</SelectItem>
                ))}
              </Select>
            </div>
            {selectedShow && isAccordionOpen && (
              <Button
                isIconOnly
                variant="ghost"
                color="danger"
                onPress={handleDeleteClick}
                aria-label="Delete show"
                className="self-center"
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            )}
          </div>

          <Accordion isOpen={isAccordionOpen}>
            <div className="flex flex-col gap-2">
              <Select
                label="Library"
                selectedKeys={formData.library ? [formData.library] : []}
                selectionMode="single"
                isRequired
                onSelectionChange={(selection) => {
                  const name = [...selection][0]?.toString() ?? "";
                  setFormData((prev) => ({
                    ...prev,
                    library: name,
                    title: "",
                  }));
                  fetchFolders(name);
                }}
              >
                {libraries.map((lib) => (
                  <SelectItem key={lib.name}>{lib.name}</SelectItem>
                ))}
              </Select>

              <Autocomplete
                label="Title"
                isRequired
                allowsCustomValue
                inputValue={formData.title}
                onInputChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: value,
                    searchQuery:
                      !prev.searchQuery || prev.searchQuery === prev.title
                        ? value
                        : prev.searchQuery,
                  }))
                }
                onSelectionChange={(key) => {
                  if (key !== null) {
                    const title = key.toString();
                    setFormData((prev) => ({
                      ...prev,
                      title,
                      searchQuery: prev.searchQuery || title,
                    }));
                  }
                }}
              >
                {libraryFolders.map((folder) => (
                  <AutocompleteItem key={folder}>{folder}</AutocompleteItem>
                ))}
              </Autocomplete>

              <Input
                label="Search"
                placeholder={formData.title || "Search"}
                value={formData.searchQuery}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    searchQuery: e.target.value,
                  }))
                }
              />

              <Input
                label="Season"
                type="number"
                min={1}
                isRequired
                value={formData.season}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, season: e.target.value }))
                }
              />

              <Select
                label="Indexer"
                selectedKeys={formData.indexer ? [formData.indexer] : []}
                selectionMode="single"
                placeholder="All indexers"
                onSelectionChange={(selection) => {
                  const id = [...selection][0]?.toString() ?? "";
                  setFormData((prev) => ({ ...prev, indexer: id }));
                }}
              >
                {indexers.map((indexer) => (
                  <SelectItem key={indexer.id}>{indexer.name}</SelectItem>
                ))}
              </Select>

              {categories.length > 0 && (
                <Select
                  label="Category"
                  selectedKeys={formData.category ? [formData.category] : []}
                  selectionMode="single"
                  placeholder="Category"
                  onSelectionChange={(selection) => {
                    const id = [...selection][0]?.toString() ?? "";
                    setFormData((prev) => ({ ...prev, category: id }));
                  }}
                >
                  {categories.map((cat) => (
                    <SelectItem key={cat.id}>{cat.name}</SelectItem>
                  ))}
                </Select>
              )}
            </div>
          </Accordion>

          <div className="flex w-full justify-center gap-2">
            {mainButton()}
            <AccordionButton
              isOpen={isAccordionOpen}
              onToggle={toggleAccordion}
            />
          </div>
        </div>

        <TorrentResults
          items={items}
          hasSearched={hasSearched}
          emptyTitle="No results found"
          emptyMessage="No torrents found for the next episode."
        />
      </main>

      <Modal
        isOpen={isDeleteOpen}
        onOpenChange={onDeleteOpenChange}
        placement="center"
        onClose={() => {
          onDeleteClose();
          setTimeout(() => setDeletingShow(null), 200);
        }}
      >
        {deletingShow && (
          <ModalContent>
            <ModalHeader>Remove tracker</ModalHeader>
            <ModalBody>
              <p>
                Do you really want to stop tracking{" "}
                <strong>{deletingShow.title}</strong>.
              </p>
              {nextEpisode && (
                <p className="text-sm text-neutral-500">
                  {nextEpisode.episode > 1
                    ? `Last downloaded episode was: S${String(nextEpisode.season).padStart(2, "0")}E${String(nextEpisode.episode - 1).padStart(2, "0")}`
                    : "No episodes downloaded yet."}
                </p>
              )}
            </ModalBody>
            <ModalFooter className="flex justify-center gap-2">
              <Button
                className="w-32"
                color="default"
                variant="ghost"
                onPress={() => {
                  onDeleteClose();
                  setTimeout(() => setDeletingShow(null), 200);
                }}
              >
                Cancel
              </Button>
              <Button
                className="w-32"
                color="danger"
                onPress={handleDeleteConfirm}
                isLoading={isDeleting}
              >
                Remove
              </Button>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </>
  );
}
