"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { MediaLibrary } from "@/app/types/MediaLibrary";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  NumberInput,
  Select,
  SelectItem,
} from "@heroui/react";
import { startTransition, useEffect, useState } from "react";

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
    season?: number;
    isEpisodeEnabled?: boolean;
    episode?: number;
    isYearEnabled?: boolean;
    year?: number;
    library?: string | Set<string> | undefined;
    incrementEpisodes?: boolean;
  }) => void;
}) {
  const [form, setForm] = useState<{
    title?: string;
    isSeasonEnabled?: boolean;
    season?: number;
    isEpisodeEnabled?: boolean;
    episode?: number;
    isYearEnabled?: boolean;
    year?: number;
    library?: string | Set<string> | undefined;
    incrementEpisodes?: boolean;
  }>({
    title: "",
    season: NaN,
    episode: NaN,
    year: NaN,
    library: undefined,
    incrementEpisodes: false,
    isSeasonEnabled: false,
    isEpisodeEnabled: false,
    isYearEnabled: false,
  });

  const numberFormat: Intl.NumberFormatOptions = { useGrouping: false };

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
          ? (firstFile.mediaInfo.season ?? NaN)
          : NaN,
        episode: files.every(
          (file) => file.mediaInfo.episode === firstFile?.mediaInfo.episode,
        )
          ? (firstFile.mediaInfo.episode ?? NaN)
          : NaN,
        year: files.every(
          (file) => file.mediaInfo.year === firstFile?.mediaInfo.year,
        )
          ? (firstFile.mediaInfo.year ?? NaN)
          : NaN,
        library:
          files.every((file) => file.library === firstFile?.library) &&
          firstFile.library.name
            ? new Set([firstFile.library.name])
            : undefined,
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
    value: string | number | boolean | Set<string>,
  ) {
    setForm((prev) => {
      // Auto-enable checkboxes when a value is set for season, episode, or year
      if (field === "season" && typeof value === "number") {
        return {
          ...prev,
          [field]: value,
          isSeasonEnabled: !isNaN(value),
        };
      }
      if (field === "episode" && typeof value === "number") {
        return {
          ...prev,
          [field]: value,
          isEpisodeEnabled: !isNaN(value),
        };
      }
      if (field === "year" && typeof value === "number") {
        return {
          ...prev,
          [field]: value,
          isYearEnabled: !isNaN(value),
        };
      }

      return { ...prev, [field]: value };
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()} placement="center">
      <ModalContent>
        <>
          <ModalHeader>Edit selected files</ModalHeader>
          <ModalBody>
            <Input
              label="Title"
              placeholder="(Unchanged)"
              value={form.title}
              type="text"
              onValueChange={(v) => handleChange("title", v)}
              radius="sm"
            />

            <NumberInput
              label="Season"
              placeholder={form.isSeasonEnabled ? "(Unchanged)" : ""}
              value={form.season}
              onValueChange={(v) => handleChange("season", v)}
              radius="sm"
              minValue={0}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={form.isSeasonEnabled}
                  onValueChange={(v) => handleChange("isSeasonEnabled", v)}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <NumberInput
              label="Episode"
              placeholder={form.isEpisodeEnabled ? "(Unchanged)" : ""}
              value={form.episode}
              onValueChange={(v) => handleChange("episode", v)}
              radius="sm"
              minValue={0}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={form.isEpisodeEnabled}
                  onValueChange={(v) => handleChange("isEpisodeEnabled", v)}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <Checkbox
              isSelected={form.incrementEpisodes}
              onValueChange={(v) => handleChange("incrementEpisodes", v)}
              size="sm"
              classNames={{ wrapper: "after:bg-emerald-700", label: "text-sm" }}
            >
              Increment episodes
            </Checkbox>

            <NumberInput
              label="Year"
              placeholder={form.isYearEnabled ? "(Unchanged)" : ""}
              value={form.year}
              onValueChange={(v) => handleChange("year", v)}
              radius="sm"
              minValue={0}
              maxValue={9999}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={form.isYearEnabled}
                  onValueChange={(v) => handleChange("isYearEnabled", v)}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <Select
              label="Media library"
              placeholder="(Unchanged)"
              items={libraries}
              selectedKeys={form.library}
              onSelectionChange={(v) =>
                handleChange("library", v as string | Set<string>)
              }
              radius="sm"
            >
              {(library) => (
                <SelectItem key={library.name}>{library.name}</SelectItem>
              )}
            </Select>
          </ModalBody>

          <ModalFooter>
            <Button onPress={() => onClose()}>Cancel</Button>
            <Button
              className="bg-emerald-700 text-white"
              onPress={() => onSaveMediaInfo(form)}
            >
              Save
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
