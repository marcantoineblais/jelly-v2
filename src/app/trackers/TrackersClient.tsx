"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import {
  faMagnifyingGlass,
  faPen,
  faPlus,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import usePersistentState from "@/src/hooks/use-persistent-state";
import PageHeader from "@/src/components/ui/PageHeader";
import RelativeTime from "@/src/components/ui/RelativeTime";
import type { TrackedShow } from "@/src/types/TrackedShow";
import type { JackettIndexer } from "@/src/libs/downloads/jackett";
import type { FeedItem } from "@/src/libs/downloads/feed-format";
import type { CheckTrackerResponse } from "../api/trackers/[id]/check/route";
import { DOWNLOAD_DEFAULT_CATEGORIES } from "@/src/config";
import useFetch from "@/src/hooks/use-fetch";
import DownloadResults from "@/src/components/downloads/DownloadResults";
import Collapse from "@/src/components/ui/Collapse";
import DisclosureButton from "@/src/components/ui/DisclosureButton";
import useFeedSearch from "@/src/hooks/use-feed-search";
import { useSession } from "@/src/providers/session-provider-client";
import { LibraryFoldersResponse } from "../api/trackers/libraries/[name]/folders/route";
import {
  formatSearchQuery,
  pad2,
  type LastEpisode,
} from "@/src/libs/trackers/library-utils";
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
  const { session, updateSession } = useSession();
  const { search, cancel: cancelSearch, isSearching } = useFeedSearch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const toggleForm = () => setIsFormOpen((open) => !open);

  const [shows, setShows] = useState<TrackedShow[]>(initialShows);
  // The selected show is a user preference; the last results stay in this browser
  const selectedShowId = session.trackers?.selectedShowId ?? "";
  const setSelectedShowId = useCallback(
    (id: string) => updateSession({ trackers: { selectedShowId: id } }),
    [updateSession],
  );
  const [lastSearch, setLastSearch] = usePersistentState<{
    showId: string;
    episode: number | null;
    items: FeedItem[];
    searchedAt: number;
  } | null>("trackers:last-search", null, { storage: "session" });

  const [isSearchDisabled, setIsSearchDisabled] = useState(false);
  const [lastEpisode, setLastEpisode] = useState<LastEpisode | null>(null);
  const [nextEpisode, setNextEpisode] = useState<number | null>(1);
  const hasSearched =
    lastSearch != null && lastSearch.showId === selectedShowId;
  const items = hasSearched ? lastSearch.items : [];

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

  useEffect(() => {
    if (selectedShowId && !shows.some((s) => s.id === selectedShowId)) {
      startTransition(() => setSelectedShowId(""));
    }
  }, [shows, selectedShowId, setSelectedShowId]);

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
    if (isFormOpen && selectedShow) return true;
    if (!isFormOpen && selectedShow) return false;
  }, [isFormOpen, selectedShow]);

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
    async (showId: string, minEpisode: number) => {
      try {
        const { data } = await fetchData<CheckTrackerResponse>(
          `/api/trackers/${showId}/check`,
          { setIsLoading: setIsSearchDisabled },
        );
        const lastEpisode = data.lastEpisode ?? null;
        setLastEpisode(lastEpisode);
        setNextEpisode(
          Math.max(
            minEpisode,
            lastEpisode?.episode != null ? lastEpisode.episode + 1 : 0,
          ),
        );
      } catch {
        setLastEpisode(null);
        setNextEpisode(1);
      }
    },
    [fetchData],
  );

  useEffect(() => {
    if (!isFormOpen) return;
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
  }, [selectedShow, isFormOpen]);

  // Suggest the next episode only when the selected show (or its minimum
  // episode) changes, so a number typed by hand survives searches, toasts
  // and other re-renders.
  const selectedMinEpisode = selectedShow?.minEpisode ?? 1;
  const loadNextEpisode = useEffectEvent((showId: string, minEpisode: number) =>
    fetchEpisode(showId, minEpisode),
  );
  useEffect(() => {
    startTransition(() => {
      if (!selectedShowId) {
        setLastEpisode(null);
        setNextEpisode(1);
        return;
      }
      loadNextEpisode(selectedShowId, selectedMinEpisode);
    });
  }, [selectedShowId, selectedMinEpisode]);

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
    // Use the saved tracker, not the edit form: the form is only filled
    // while it is open and can still hold another show's values.
    const additionalQuery = selectedShow.additionalQuery?.trim() ?? "";

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

    const results = await search(params);
    if (results === null) return;
    setLastSearch({
      showId: selectedShow.id,
      episode,
      items: results,
      searchedAt: Date.now(),
    });
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
      toggleForm();
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
      toggleForm();
      fetchEpisode(selectedShow.id, payload.minEpisode ?? 1);
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
        setLastSearch(null);
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
    if (isFormOpen) {
      if (selectedShow) {
        return (
          <Button
            className="grow"
            isLoading={isFormSubmitting}
            onClick={handleUpdate}
          >
            Save changes
          </Button>
        );
      }
      return (
        <Button
          className="grow"
          isLoading={isFormSubmitting}
          onClick={handleAdd}
        >
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add tracker
        </Button>
      );
    }
    if (isSearching) {
      return (
        <Button color="default" className="grow" onClick={cancelSearch}>
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
          Cancel search
        </Button>
      );
    }
    return (
      <Button
        className="grow"
        isDisabled={!selectedShow || isSearchDisabled}
        onClick={handleSearch}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
        {selectedShow && nextEpisode != null
          ? `Search S${pad2(selectedShow.season)}E${pad2(nextEpisode)}`
          : "Search next episode"}
      </Button>
    );
  }

  return (
    <>
      <main className="container-main h-full w-full flex flex-col gap-4 px-4 pt-6 overflow-hidden">
        <PageHeader
          title="Trackers"
          subtitle={
            shows.length > 0
              ? `${shows.length} show${shows.length > 1 ? "s" : ""} tracked${
                  selectedShow && lastEpisode?.episode != null
                    ? ` · last downloaded S${pad2(lastEpisode.season)}E${pad2(lastEpisode.episode)}`
                    : ""
                }`
              : "Follow shows and grab the next episode in one tap"
          }
        />

        <div className="card p-3 flex flex-col gap-3 shrink-0">
          {/* Spacing lives inside the Collapse (pt-3) rather than in the
              flex gap, so closing doesn't jump at the end. */}
          <div>
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

              {selectedShow && isFormOpen && (
                <IconButton
                  color="danger"
                  onClick={handleDeleteClick}
                  ariaLabel="Delete tracker"
                  className="shrink-0 size-10 rounded-xl border border-border bg-surface-elevated hover:bg-danger/10 hover:border-danger/40 flex justify-center items-center self-end"
                  icon={faTrash}
                />
              )}

              {selectedShow && !isFormOpen && (
                <NumberInput
                  id="nextEpisode"
                  className="shrink-0 w-20"
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

            <Collapse isOpen={isFormOpen} className="-mx-1 px-1">
              <div className="flex flex-col gap-2 pt-3">
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
            </Collapse>
          </div>

          <div className="flex w-full justify-center gap-2">
            {mainButton()}
            <DisclosureButton
              isOpen={isFormOpen}
              onToggle={toggleForm}
              label={isFormOpen ? "Close" : selectedShow ? "Edit" : "New"}
              icon={isFormOpen ? faXmark : selectedShow ? faPen : faPlus}
            />
          </div>
        </div>

        {hasSearched && !isSearching && lastSearch && (
          <p className="shrink-0 text-xs text-text-muted">
            <span className="text-text-secondary font-medium tabular-nums">
              {items.length}
            </span>{" "}
            result{items.length === 1 ? "" : "s"}
            {lastSearch.episode != null && selectedShow
              ? ` for S${pad2(selectedShow.season)}E${pad2(lastSearch.episode)}`
              : ""}{" "}
            · <RelativeTime timestamp={lastSearch.searchedAt} />
          </p>
        )}

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

            <p className="mt-4 text-sm text-text-muted">
              {lastEpisode?.episode != null
                ? `Last downloaded episode was: S${pad2(lastEpisode.season)}E${pad2(lastEpisode.episode)}`
                : "No episodes downloaded yet."}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
