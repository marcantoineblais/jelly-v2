"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import type { TrackedShow } from "@/src/types/TrackedShow";
import type { JackettIndexer } from "@/src/libs/downloads/jackett";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { CheckTrackerResponse } from "../api/trackers/[id]/check/route";
import type { FeedResponse } from "../api/downloads/feed/route";
import { DOWNLOAD_DEFAULT_CATEGORIES } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";
import DownloadResults from "@/src/components/downloads/DownloadResults";
import {
  Accordion,
  AccordionButton,
  useAccordion,
} from "@/src/components/accordion";
import { LibraryFoldersResponse } from "../api/trackers/libraries/[name]/folders/route";
import { formatSearchQuery, pad2 } from "@/src/libs/trackers/library-utils";
import { FetchError } from "@/src/libs/fetch-error";
import useValidation from "@/src/hooks/use-validation";
import { validateFormData } from "@/src/libs/validation/tracker-validations";
import useModal from "@/src/hooks/useModal";
import { useToast } from "@/src/providers/ToastProvider";
import Button from "@/src/components/ui/Button";
import SelectInput from "@/src/components/ui/SelectInput";
import IconButton from "@/src/components/ui/IconButton";
import NumberInput from "@/src/components/ui/NumberInput";
import Autocomplete from "@/src/components/ui/Autocomplete";
import Input from "@/src/components/ui/Input";
import Modal from "@/src/components/Modal";

type TrackerFormData = {
  title: string;
  season: number | null;
  minEpisode: number | null;
  library: string;
  additionalQuery: string;
  indexer: string;
  category: string;
};

const EMPTY_FORM: TrackerFormData = {
  title: "",
  season: 1,
  minEpisode: 1,
  library: "",
  additionalQuery: "",
  indexer: "",
  category: "",
};

function buildTrackerPayload(formData: TrackerFormData) {
  return {
    title: formData.title.trim(),
    library: formData.library.trim(),
    season: formData.season,
    minEpisode: formData.minEpisode,
    additionalQuery: formData.additionalQuery.trim(),
    indexer: formData.indexer.trim(),
    category: formData.category.trim(),
  };
}

type TrackersClientProps = {
  initialShows: TrackedShow[];
  libraries: { name: string; path: string }[];
  indexers: JackettIndexer[];
};

export default function TrackersClient({
  initialShows,
  libraries,
  indexers,
}: TrackersClientProps) {
  const { fetchData } = useFetch();
  const toast = useToast();
  const { validate, errorMessage, setErrors, revalidateOnError } =
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
  const [nextEpisode, setNextEpisode] = useState<number | null>(1);
  const [items, setItems] = useState<FeedItem[]>([]);

  const [formData, setFormData] = useState<TrackerFormData>(EMPTY_FORM);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [libraryContent, setLibraryContent] = useState<string[]>([]);

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useModal();
  const [deletingShow, setDeletingShow] = useState<TrackedShow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedShow = shows.find((s) => s.id === selectedShowId);

  const sortedShowOptions = useMemo(
    () =>
      [...shows]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((show) => ({ label: show.title, value: show.id })),
    [shows],
  );

  const indexerOptions = useMemo(
    () =>
      indexers.map((indexer) => ({ label: indexer.name, value: indexer.id })),
    [indexers],
  );

  const categoryOptions = useMemo(() => {
    let categories = DOWNLOAD_DEFAULT_CATEGORIES;
    const indexer = indexers.find((i) => i.id === formData.indexer);
    if (indexer) categories = indexer.categories;
    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [formData.indexer, indexers]);

  const libraryOptions = useMemo(
    () =>
      libraries.map((library) => ({
        label: library.name,
        value: library.name,
      })),
    [libraries],
  );

  const libraryMediaOptions = useMemo(
    () => libraryContent.map((content) => ({ label: content, value: content })),
    [libraryContent],
  );

  const isOpen = useMemo(() => {
    if (isAccordionOpen && selectedShow) return true;
    if (!isAccordionOpen && selectedShow) return false;
  }, [isAccordionOpen, selectedShow]);

  const fetchFolders = useCallback(
    async (libraryName: string) => {
      if (!libraryName) {
        setLibraryContent([]);
        return;
      }
      try {
        const { data } = await fetchData<LibraryFoldersResponse>(
          `/api/trackers/libraries/${encodeURIComponent(libraryName)}/folders`,
        );
        setLibraryContent(data.folders);
      } catch {
        setLibraryContent([]);
      }
    },
    [fetchData],
  );

  const fetchEpisode = useCallback(
    async (showId: string) => {
      try {
        const { data } = await fetchData<CheckTrackerResponse>(
          `/api/trackers/${showId}/check`,
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

  useEffect(() => {
    if (!isAccordionOpen) return;
    startTransition(() => {
      if (selectedShow) {
        setFormData({
          title: selectedShow.title,
          season: selectedShow.season,
          minEpisode: selectedShow.minEpisode,
          library: selectedShow.library,
          additionalQuery: selectedShow.additionalQuery ?? "",
          indexer: selectedShow.indexer ?? "",
          category: selectedShow.category ?? "",
        });
      } else {
        setFormData(EMPTY_FORM);
        setLibraryContent([]);
      }
    });
  }, [selectedShow, isAccordionOpen]);

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
        setLibraryContent([]);
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

    const hasErrors = validate({
      title,
      season,
      episode,
      additionalQuery,
      ...additionalValidation,
    });
    if (hasErrors || episode == null) return;

    const payload = { title, season, episode, additionalQuery };
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
        `/api/downloads/feed?${params}`,
        { setIsLoading: setIsSearchLoading },
      );
      setItems(data.items);
    } catch {
      setItems([]);
    }
    setHasSearched(true);
  }

  async function handleAdd() {
    const payload = buildTrackerPayload(formData);
    const hasErrors = validate(payload);
    if (hasErrors) return;

    try {
      const { data } = await fetchData<{ ok: boolean; show: TrackedShow }>(
        "/api/trackers",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          setIsLoading: setIsFormSubmitting,
        },
      );
      setShows((prev) => [...prev, data.show]);
      setFormData(EMPTY_FORM);
      setLibraryContent([]);
      toggleAccordion();
      toast.success("Tracker added");
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
    const payload = buildTrackerPayload(formData);
    const hasErrors = validate(payload);
    if (hasErrors) return;

    try {
      const { data } = await fetchData<{ ok: boolean; show: TrackedShow }>(
        `/api/trackers/${selectedShow.id}`,
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
      toast.success("Tracker updated");
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
      await fetchData(`/api/trackers/${deletingShow.id}`, {
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
      toast.success("Tracker removed");
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
            className="w-44 shadow-btn"
            isLoading={isFormSubmitting}
            onClick={handleUpdate}
          >
            Update
          </Button>
        );
      }
      return (
        <Button
          className="w-44 shadow-btn"
          isLoading={isFormSubmitting}
          onClick={handleAdd}
        >
          Add
        </Button>
      );
    }
    return (
      <Button
        className="w-44 shadow-btn"
        isLoading={isSearchLoading}
        isDisabled={!selectedShow || isSearchDisabled}
        onClick={handleSearch}
      >
        Search
      </Button>
    );
  }

  return (
    <>
      <main className="container-main h-full w-full flex flex-col gap-4 p-4 pb-8 overflow-hidden">
        <div className="flex flex-col gap-2 p-3 bg-white/80 rounded-lg border border-stone-200">
          <div className="flex gap-2">
            <SelectInput
              id="show"
              className="grow min-w-0"
              data-open={isOpen}
              label="Show"
              error={errorMessage("show")}
              validate={(value) => revalidateOnError("show", value)}
              placeholder="Select a show"
              options={sortedShowOptions}
              value={new Set([selectedShowId])}
              onChange={(value) =>
                setSelectedShowId(([...value][0] as string) ?? "")
              }
            />

            {selectedShow && isAccordionOpen && (
              <IconButton
                color="danger"
                onClick={handleDeleteClick}
                ariaLabel="Delete tracker"
                className="shrink-0 size-9 rounded border border-border flex justify-center items-center self-end"
                icon={faTrash}
              />
            )}

            {selectedShow && !isAccordionOpen && (
              <NumberInput
                id="nextEpisode"
                className="shrink-0 w-16"
                min={0}
                max={999}
                label="Ep."
                value={nextEpisode}
                onChange={setNextEpisode}
                error={errorMessage("nextEpisode")}
                validate={(value) => revalidateOnError("nextEpisode", value)}
              />
            )}
          </div>

          <Accordion isOpen={isAccordionOpen}>
            <div className="flex flex-col gap-2">
              <SelectInput
                id="library"
                label="Library"
                options={libraryOptions}
                value={new Set([formData.library])}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    library: [...value][0] ?? "",
                    title: "",
                  }))
                }
                error={errorMessage("library")}
                validate={(value) =>
                  revalidateOnError("library", [...value][0] ?? "")
                }
              />

              <Autocomplete
                id="title"
                label="Title"
                value={formData.title}
                error={errorMessage("title")}
                validate={(value) => revalidateOnError("title", value)}
                options={libraryMediaOptions}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: value,
                  }))
                }
                isClearable
              />

              <Input
                id="additionalQuery"
                label="Additional query"
                value={formData.additionalQuery}
                error={errorMessage("additionalQuery")}
                validate={(value) =>
                  revalidateOnError("additionalQuery", value)
                }
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, additionalQuery: value }))
                }
                isClearable
              />

              <div className="flex gap-2">
                <NumberInput
                  id="season"
                  label="Season"
                  className="grow"
                  min={0}
                  max={999}
                  value={formData.season}
                  error={errorMessage("season")}
                  validate={(value) => revalidateOnError("season", value)}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      season: value,
                    }))
                  }
                />

                <NumberInput
                  id="minEpisode"
                  label="Min episode"
                  min={0}
                  max={999}
                  className="grow"
                  value={formData.minEpisode}
                  error={errorMessage("minEpisode")}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      minEpisode: value,
                    }))
                  }
                />
              </div>

              <SelectInput
                id="indexer"
                label="Indexer"
                value={new Set([formData.indexer])}
                placeholder="All indexers"
                options={indexerOptions}
                error={errorMessage("indexer")}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    indexer: ([...value][0] as string) ?? "",
                  }))
                }
                isClearable
              />

              {categoryOptions.length > 0 && (
                <SelectInput
                  id="category"
                  label="Category"
                  value={new Set([formData.category])}
                  options={categoryOptions}
                  placeholder="Category"
                  error={errorMessage("category")}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: [...value][0] ?? "",
                    }))
                  }
                  isClearable
                />
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

        <DownloadResults
          items={items}
          hasSearched={hasSearched}
          emptyTitle="No results found"
          emptyMessage="No torrents found for the next episode."
        />
      </main>

      <Modal
        title="Remove tracker"
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onUnmount={() => setDeletingShow(null)}
        footer={
          <>
            <Button
              className="w-32"
              color="default"
              onClick={() => {
                onDeleteClose();
                setTimeout(() => setDeletingShow(null), 200);
              }}
            >
              Cancel
            </Button>
            <Button
              className="w-32"
              color="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Remove
            </Button>
          </>
        }
      >
        {deletingShow && (
          <div>
            <p>
              Do you really want to stop tracking{" "}
              <strong>{deletingShow.title}</strong>?
            </p>

            <p className="mt-4 text-sm text-neutral-500">
              {lastEpisode?.episode
                ? `Last downloaded episode was: S${pad2(lastEpisode.season)}E${pad2(lastEpisode.episode)}`
                : "No episodes downloaded yet."}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
