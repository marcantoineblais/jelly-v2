"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { MediaLibrary } from "@/src/types/MediaLibrary";
import { startTransition, useEffect, useMemo, useState } from "react";
import { createFilename } from "@/src/libs/files/createFilename";
import {
  applyMediaInfoEdit,
  createMediaEditForm,
  EMPTY_MEDIA_EDIT_FORM,
  type MediaEditFormData,
} from "@/src/libs/files/applyMediaInfoEdit";
import Modal from "../Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import CheckboxInput from "../ui/CheckboxInput";
import NumberInput from "../ui/NumberInput";
import SelectInput from "../ui/SelectInput";
import InfoBox from "../ui/InfoBox";

type MediaEditFormProps = {
  files: MediaFile[];
  libraries: MediaLibrary[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: MediaEditFormData) => void;
};

export default function MediaEditForm({
  files,
  libraries,
  isOpen,
  onClose,
  onSave,
}: MediaEditFormProps) {
  const [form, setForm] = useState<MediaEditFormData>(EMPTY_MEDIA_EDIT_FORM);

  const options = useMemo(
    () =>
      libraries
        .filter((library) => library.name)
        .map((library) => ({ label: library.name!, value: library.name! })),
    [libraries],
  );

  // Pre-fill the form each time it opens for a new selection
  useEffect(() => {
    if (!isOpen || files.length === 0) return;
    startTransition(() => setForm(createMediaEditForm(files)));
  }, [files, isOpen]);

  function handleChange<K extends keyof MediaEditFormData>(
    field: K,
    value: MediaEditFormData[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Typing a value enables the matching field, clearing it disables it
      if (field === "season") next.isSeasonEnabled = value != null;
      if (field === "episode") next.isEpisodeEnabled = value != null;
      if (field === "year") next.isYearEnabled = value != null;
      return next;
    });
  }

  const preview = useMemo(() => {
    const first = files[0];
    if (!first) return "";
    const { mediaInfo } = applyMediaInfoEdit(first, form, libraries);
    return `${createFilename(mediaInfo)}${first.ext ?? ""}`;
  }, [files, form, libraries]);

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
      onClose={onClose}
      footer={
        <>
          <Button color="default" className="w-28" onClick={onClose}>
            Cancel
          </Button>
          <Button className="w-28" onClick={() => onSave(form)}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 md:w-lg">
        <InfoBox label={files.length > 1 ? "Preview (first file)" : "Preview"}>
          <p className="font-mono text-xs text-primary-light break-all">
            {preview}
          </p>
        </InfoBox>

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
          onChange={(v) => handleChange("library", [...v][0] || undefined)}
        />
      </div>
    </Modal>
  );
}
