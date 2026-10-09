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
import { createFilename } from "@/src/libs/files/createFilename";

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

  const preview = useMemo(() => {
    const first = files[0];
    if (!first) return "";
    const info = { ...first.mediaInfo };
    if (form.useOriginalName) info.title = first.name;
    else if (form.title) info.title = form.title.trim();
    info.season = form.isSeasonEnabled
      ? (form.season ?? info.season)
      : undefined;
    info.episode = form.isEpisodeEnabled
      ? (form.episode ?? info.episode)
      : undefined;
    info.year = form.isYearEnabled ? (form.year ?? info.year) : undefined;
    return `${createFilename(info)}${first.ext ?? ""}`;
  }, [files, form]);

  const numberFields = [
    {
      id: "season",
      label: "Season",
      enabledKey: "isSeasonEnabled",
      enabled: form.isSeasonEnabled,
      value: form.season,
      max: undefined,
    },
    {
      id: "episode",
      label: "Episode",
      enabledKey: "isEpisodeEnabled",
      enabled: form.isEpisodeEnabled,
      value: form.episode,
      max: undefined,
    },
    {
      id: "year",
      label: "Year",
      enabledKey: "isYearEnabled",
      enabled: form.isYearEnabled,
      value: form.year,
      max: 9999,
    },
  ] as const;

  return (
    <Modal
      title={files.length > 1 ? `Edit ${files.length} files` : "Edit file"}
      isOpen={isOpen}
      onClose={() => onClose()}
      footer={
        <>
          <Button color="default" className="w-28" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button className="w-28" onClick={() => onSaveMediaInfo(form)}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 md:w-lg">
        <div className="rounded-xl bg-surface/60 border border-border px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wider text-text-muted">
            {files.length > 1 ? "Preview (first file)" : "Preview"}
          </div>
          <p className="mt-0.5 font-mono text-xs text-primary-light break-all">
            {preview}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Input
            id="title"
            label="Title"
            placeholder="(Unchanged)"
            value={form.title}
            type="text"
            isDisabled={form.useOriginalName}
            onChange={(v) => handleChange("title", v)}
            isClearable
          />

          <CheckboxInput
            id="useOriginalName"
            checked={form.useOriginalName}
            label="Use original filename"
            onChange={(v) => handleChange("useOriginalName", v)}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {numberFields.map((field) => (
            <div
              key={field.id}
              data-enabled={field.enabled || undefined}
              className="rounded-xl border border-border p-2.5 pt-2 transition-colors duration-200 data-enabled:border-primary/30 data-enabled:bg-primary/5"
            >
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor={field.id}
                  className="text-xs font-medium tracking-wide text-text-secondary"
                >
                  {field.label}
                </label>
                <CheckboxInput
                  id={field.enabledKey}
                  checked={field.enabled}
                  onChange={(v) => handleChange(field.enabledKey, v)}
                />
              </div>
              <NumberInput
                id={field.id}
                placeholder={field.enabled ? "(Unchanged)" : "None"}
                value={field.value}
                onChange={(v) => handleChange(field.id, v)}
                min={0}
                max={field.max}
              />
            </div>
          ))}
        </div>

        {files.length > 1 && (
          <CheckboxInput
            id="incrementEpisodes"
            label="Increment episode number for each file"
            checked={form.incrementEpisodes}
            onChange={(v) => handleChange("incrementEpisodes", v)}
          />
        )}

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
