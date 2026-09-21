"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { startTransition, useEffect, useMemo, useState } from "react";
import Modal from "../Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import CheckboxInput from "../ui/CheckboxInput";
import NumberInput from "../ui/NumberInput";
import SelectInput from "../ui/SelectInput";

export default function MediaEditForm({
  files = [],
  libraries = [],
  isOpen = false,
  onClose = () => {},
  onSaveMediaInfo = () => {},
}: {
  files: MediaFile[];
  libraries?: MediaLibrary[];
  isOpen?: boolean;
  onClose?: () => void;
  onSaveMediaInfo?: (form: {
    title?: string;
    isSeasonEnabled?: boolean;
    season?: number | null;
    isEpisodeEnabled?: boolean;
    episode?: number | null;
    isYearEnabled?: boolean;
    year?: number | null;
    library?: string | undefined;
    useOriginalName?: boolean;
    incrementEpisodes?: boolean;
  }) => void;
}) {
  const [form, setForm] = useState<{
    title?: string;
    isSeasonEnabled?: boolean;
    season?: number | null;
    isEpisodeEnabled?: boolean;
    episode?: number | null;
    isYearEnabled?: boolean;
    year?: number | null;
    library?: string;
    useOriginalName?: boolean;
    incrementEpisodes?: boolean;
  }>({
    title: "",
    season: null,
    episode: null,
    year: null,
    library: undefined,
    useOriginalName: false,
    incrementEpisodes: false,
    isSeasonEnabled: false,
    isEpisodeEnabled: false,
    isYearEnabled: false,
  });

  const options = useMemo(
    () =>
      libraries
        .filter((lab) => lab.name)
        .map((lab) => ({ label: lab.name, value: lab.name })) as {
        label: string;
        value: string;
      }[],
    [libraries],
  );

  // Initialize/reset form state when files or libraries change
  useEffect(() => {
    const firstFile = files[0];
    if (!firstFile) return;
    startTransition(() => {
      setForm({
        title: files.every(
          (file) => file.mediaInfo.title === firstFile?.mediaInfo.title,
        )
          ? (firstFile.mediaInfo.title ?? "")
          : "",
        season: files.every(
          (file) => file.mediaInfo.season === firstFile?.mediaInfo.season,
        )
          ? (firstFile.mediaInfo.season ?? null)
          : null,
        episode: files.every(
          (file) => file.mediaInfo.episode === firstFile?.mediaInfo.episode,
        )
          ? (firstFile.mediaInfo.episode ?? null)
          : null,
        year: files.every(
          (file) => file.mediaInfo.year === firstFile?.mediaInfo.year,
        )
          ? (firstFile.mediaInfo.year ?? null)
          : null,
        library:
          files.every((file) => file.library === firstFile?.library) &&
          firstFile.library.name
            ? firstFile.library.name
            : undefined,
        useOriginalName: false,
        incrementEpisodes: false,
        isSeasonEnabled: files.some(
          (file) => file.mediaInfo.season !== undefined,
        ),
        isEpisodeEnabled: files.some(
          (file) => file.mediaInfo.episode !== undefined,
        ),
        isYearEnabled: files.some((file) => file.mediaInfo.year !== undefined),
      });
    });
  }, [files, libraries]);

  // Handlers for form fields
  function handleChange(
    field: string,
    value: string | number | boolean | null,
  ) {
    setForm((prev) => {
      // Auto-enable checkboxes when a value is set for season, episode, or year
      if (field === "season" && (value === null || typeof value === "number")) {
        return {
          ...prev,
          [field]: value,
          isSeasonEnabled: value != null,
        };
      }
      if (
        field === "episode" &&
        (value === null || typeof value === "number")
      ) {
        return {
          ...prev,
          [field]: value,
          isEpisodeEnabled: value != null,
        };
      }
      if (field === "year" && (value === null || typeof value === "number")) {
        return {
          ...prev,
          [field]: value,
          isYearEnabled: value != null,
        };
      }

      return { ...prev, [field]: value };
    });
  }

  return (
    <Modal
      title="Edit selected files"
      isOpen={isOpen}
      onClose={() => onClose()}
      footer={
        <>
          <Button color="default" className="w-32" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button className="w-32" onClick={() => onSaveMediaInfo(form)}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Input
            id="title"
            label="Title"
            placeholder="(Unchanged)"
            value={form.title}
            type="text"
            onChange={(v) => handleChange("title", v)}
          />

          <CheckboxInput
            id="useOriginalName"
            checked={form.useOriginalName}
            label="Use original filename"
            onChange={(v) => handleChange("useOriginalName", v)}
          />
        </div>

        <div className="flex items-center gap-2">
          <NumberInput
            id="season"
            label="Season"
            placeholder={form.isSeasonEnabled ? "(Unchanged)" : ""}
            className="grow"
            value={form.season}
            onChange={(v) => handleChange("season", v)}
            min={0}
          />
          <div className="self-end flex items-center h-9">
            <CheckboxInput
              id="isSeasonEnabled"
              checked={form.isSeasonEnabled}
              onChange={(v) => handleChange("isSeasonEnabled", v)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <NumberInput
              id="episode"
              label="Episode"
              className="grow"
              placeholder={form.isEpisodeEnabled ? "(Unchanged)" : ""}
              value={form.episode}
              onChange={(v) => handleChange("episode", v)}
              min={0}
            />
            <div className="self-end flex items-center h-9">
              <CheckboxInput
                id="isEpisodeEnabled"
                checked={form.isEpisodeEnabled}
                onChange={(v) => handleChange("isEpisodeEnabled", v)}
              />
            </div>
          </div>

          <CheckboxInput
            id="incrementEpisodes"
            label="Increment episodes"
            checked={form.incrementEpisodes}
            onChange={(v) => handleChange("incrementEpisodes", v)}
          />
        </div>

        <div className="flex items-center gap-2">
          <NumberInput
            id="year"
            label="Year"
            className="grow"
            placeholder={form.isYearEnabled ? "(Unchanged)" : ""}
            value={form.year}
            onChange={(v) => handleChange("year", v)}
            min={0}
            max={9999}
          />
          <div className="self-end flex items-center h-9">
            <CheckboxInput
              id="isYearEnabled"
              checked={form.isYearEnabled}
              onChange={(v) => handleChange("isYearEnabled", v)}
            />
          </div>
        </div>

        <SelectInput
          id="library"
          label="Media library"
          placeholder="(Unchanged)"
          options={options}
          value={new Set([form.library])}
          onChange={(v) => handleChange("library", [...v][0] ?? "")}
        />
      </div>
    </Modal>
  );
}
