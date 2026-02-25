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
  NumberInput,
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
import { formatSearchQuery, pad2 } from "@/src/libs/shows/library-utils";
import { FetchError } from "@/src/libs/fetch-error";
import useValidation from "@/src/hooks/use-validation";
import { validateFormData } from "@/src/libs/validation/show-validations";

type ShowFormData = {
  title: string;
  season: number;
  minEpisode: number;
  library: string;
  additionalQuery: string;
  indexer: string;
  category: string;
};

const EMPTY_FORM: ShowFormData = {
  title: "",
  season: 1,
  minEpisode: 1,
  library: "",
  additionalQuery: "",
  indexer: "",
  category: "",
};

type ShowsClientProps = {
  initialShows: TrackedShow[];
  libraries: { name: string; path: string }[];
  indexers: JackettIndexer[];
};

export default function ShowsClient({
  initialShows,
  libraries,
  indexers,
}: ShowsClientProps) {
  const { fetchData } = useFetch();
  const { validate, isInvalid, errorMessage, setErrors, revalidateOnError } =
    useValidation(validateFormData);
  const { isOpen: isAccordionOpen, toggle: toggleAccordion } = useAccordion();

  const [shows, setShows] = useState<TrackedShow[]>(initialShows);
  const [selectedShowId, setSelectedShowId] = useState("");

  const [isSearchDisabled, setIsSearchDisabled] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastEpisode, setLastEpisode] = useState<{
    season: number;
    episode: number;
  } | null>(null);
  const [nextEpisode, setNextEpisode] = useState<number>(1);
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
        const lastEpisode = data.lastEpisode ?? null;
        setLastEpisode(lastEpisode);
        setNextEpisode(
          Math.max(
            selectedShow?.minEpisode ?? 1,
            (lastEpisode?.episode ?? 0) + 1,
          ),
        );
      } catch {
        setLastEpisode(null);
        setNextEpisode(1);
      }
    },
    [fetchData, selectedShow],
  );

  // Update form data when accordion is opened
  useEffect(() => {
    if (!isAccordionOpen) return;
    startTransition(() => {
      if (selectedShow) {
        setFormData({
          title: selectedShow.title,
          season: selectedShow.season,
          minEpisode: selectedShow.minEpisode,
          library: selectedShow.library,
          additionalQuery: "",
          indexer: selectedShow.indexer ?? "",
          category: selectedShow.category ?? "",
        });
      } else {
        setFormData(EMPTY_FORM);
        setLibraryFolders([]);
      }
    });
  }, [selectedShow, isAccordionOpen]);

  // Fetch next episode when show is selected
  useEffect(() => {
    startTransition(() => {
      if (!selectedShowId) {
        setLastEpisode(null);
        setNextEpisode(1);
        return;
      }
      fetchEpisode(selectedShowId);
    });
  }, [selectedShowId, fetchEpisode]);

  useEffect(() => {
    startTransition(() => {
      if (!formData.library) {
        setLibraryFolders([]);
        return;
      }
      fetchFolders(formData.library);
    });
  }, [formData.library, fetchFolders]);

  async function handleSearch() {
    if (!selectedShow) return;

    const additionalValidation = {
      show: selectedShow.title.trim(),
      nextEpisode,
    };

    const title = selectedShow.title.trim();
    const season = selectedShow.season;
    const episode = nextEpisode;
    const additionalQuery = formData.additionalQuery.trim();

    const payload = { title, season, episode, additionalQuery };
    const hasErrors = validate({ ...payload, ...additionalValidation });
    if (hasErrors) return;

    const query = formatSearchQuery(payload);
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
    const season = formData.season;
    const minEpisode = formData.minEpisode;
    const additionalQuery = formData.additionalQuery.trim();
    const indexer = formData.indexer.trim();
    const category = formData.category.trim();

    const payload = {
      title,
      library,
      season,
      minEpisode,
      additionalQuery,
      indexer,
      category,
    };

    const hasErrors = validate(payload);
    if (hasErrors) return;

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
    } catch (err) {
      if (err instanceof FetchError) {
        const serverErrors = (err.data as { errors?: Record<string, string> })
          ?.errors;
        if (serverErrors) setErrors(serverErrors);
      }
    }
  }

  async function handleUpdate() {
    if (!selectedShow) return;
    const title = formData.title.trim();
    const library = formData.library.trim();
    const season = formData.season;
    const minEpisode = formData.minEpisode;
    const additionalQuery = formData.additionalQuery.trim();
    const indexer = formData.indexer.trim();
    const category = formData.category.trim();

    const payload = {
      title,
      library,
      season,
      minEpisode,
      additionalQuery,
      indexer,
      category,
    };

    const hasErrors = validate(payload);
    if (hasErrors) return;

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
    } catch (err) {
      if (err instanceof FetchError) {
        const serverErrors = (err.data as { errors?: Record<string, string> })
          ?.errors;
        if (serverErrors) setErrors(serverErrors);
      }
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
        setLastEpisode(null);
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
                isInvalid={isInvalid("show")}
                errorMessage={errorMessage("show")}
                placeholder="Select a show"
                selectedKeys={selectedShowId ? [selectedShowId] : []}
                selectionMode="single"
                onSelectionChange={(selection) => {
                  const value = [...selection][0]?.toString();
                  setSelectedShowId(value ?? "");
                  revalidateOnError("show", value);
                }}
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

            {selectedShow && !isAccordionOpen && (
              <NumberInput
                className="w-20"
                min={0}
                label="Next"
                value={nextEpisode}
                onValueChange={(value) => {
                  setNextEpisode(Math.max(value, 0));
                  revalidateOnError("nextEpisode", value);
                }}
                isInvalid={isInvalid("nextEpisode")}
                errorMessage={errorMessage("nextEpisode")}
              />
            )}
          </div>

          <Accordion isOpen={isAccordionOpen}>
            <div className="flex flex-col gap-2">
              <Select
                label="Library"
                selectedKeys={formData.library ? [formData.library] : []}
                selectionMode="single"
                isInvalid={isInvalid("library")}
                errorMessage={errorMessage("library")}
                onSelectionChange={(selection) => {
                  const name = [...selection][0]?.toString() ?? "";
                  setFormData((prev) => ({
                    ...prev,
                    library: name,
                    title: "",
                  }));
                  revalidateOnError("library", name);
                }}
              >
                {libraries.map((lib) => (
                  <SelectItem key={lib.name}>{lib.name}</SelectItem>
                ))}
              </Select>

              <Autocomplete
                label="Title"
                allowsCustomValue
                inputValue={formData.title}
                isInvalid={isInvalid("title")}
                errorMessage={errorMessage("title")}
                onClear={() => setFormData((prev) => ({ ...prev, title: "" }))}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, title: value }));
                  revalidateOnError("title", value);
                }}
                onSelectionChange={(key) => {
                  const title = key ? key.toString() : "";
                  setFormData((prev) => ({ ...prev, title }));
                  revalidateOnError("title", title);
                }}
              >
                {libraryFolders.map((folder) => (
                  <AutocompleteItem key={folder}>{folder}</AutocompleteItem>
                ))}
              </Autocomplete>

              <Input
                label="Additional query"
                value={formData.additionalQuery}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, additionalQuery: value }))
                }
              />

              <div className="flex gap-2">
                <NumberInput
                  label="Season"
                  min={0}
                  value={formData.season}
                  isInvalid={isInvalid("season")}
                  errorMessage={errorMessage("season")}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      season: Math.max(value, 0),
                    }));
                    revalidateOnError("season", value);
                  }}
                />

                <NumberInput
                  label="Min episode"
                  min={0}
                  value={formData.minEpisode}
                  isInvalid={isInvalid("minEpisode")}
                  errorMessage={errorMessage("minEpisode")}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      minEpisode: Math.max(value, 0),
                    }));
                    revalidateOnError("minEpisode", value);
                  }}
                />
              </div>

              <Select
                label="Indexer"
                selectedKeys={formData.indexer ? [formData.indexer] : []}
                selectionMode="single"
                placeholder="All indexers"
                isInvalid={isInvalid("indexer")}
                errorMessage={errorMessage("indexer")}
                onSelectionChange={(selection) => {
                  const id = [...selection][0]?.toString() ?? "";
                  setFormData((prev) => ({ ...prev, indexer: id }));
                  revalidateOnError("indexer", id);
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
                  isInvalid={isInvalid("category")}
                  errorMessage={errorMessage("category")}
                  onSelectionChange={(selection) => {
                    const id = [...selection][0]?.toString() ?? "";
                    setFormData((prev) => ({ ...prev, category: id }));
                    revalidateOnError("category", id);
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

              <p className="text-sm text-neutral-500">
                {lastEpisode?.episode
                  ? `Last downloaded episode was: S${pad2(lastEpisode.season)}E${pad2(lastEpisode.episode)}`
                  : "No episodes downloaded yet."}
              </p>
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
