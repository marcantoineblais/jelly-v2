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
import { useEffect, useRef, useState } from "react";

export default function MediaEditForm({
  files = [],
  libraries = [],
  isOpen = false,
  onClose = () => {},
}: {
  files: MediaFile[];
  libraries?: MediaLibrary[];
  isOpen?: boolean;
  onClose?: (unselectAll?: boolean) => void;
}) {
  const [updatedTitle, setUpdatedTitle] = useState<string>("");
  const [updatedSeason, setUpdatedSeason] = useState<number>(NaN);
  const [updatedEpisode, setUpdatedEpisode] = useState<number>(NaN);
  const [updatedYear, setUpdatedYear] = useState<number>(NaN);
  const [updatedLibraryName, setUpdatedLibraryName] = useState<any>({});
  const [incrementEpisodes, setIncrementEpisodes] = useState<boolean>(false);
  const [isSeasonEnabled, setIsSeasonEnabled] = useState<boolean>(false);
  const [isEpisodeEnabled, setIsEpisodeEnabled] = useState<boolean>(false);
  const [isYearEnabled, setIsYearEnabled] = useState<boolean>(false);

  const numberFormat: Intl.NumberFormatOptions = { useGrouping: false };

  useEffect(() => {
    if (!isNaN(updatedSeason)) setIsSeasonEnabled(true);
  }, [updatedSeason]);

  useEffect(() => {
    if (!isNaN(updatedEpisode)) setIsEpisodeEnabled(true);
  }, [updatedEpisode]);

  useEffect(() => {
    if (!isNaN(updatedYear)) setIsYearEnabled(true);
  }, [updatedYear]);

  useEffect(() => {
    if (!isSeasonEnabled) {
      setUpdatedSeason(NaN);
    }
  }, [isSeasonEnabled]);

  useEffect(() => {
    if (!isEpisodeEnabled) {
      setUpdatedEpisode(NaN);
    }
  }, [isEpisodeEnabled]);

  useEffect(() => {
    if (!isYearEnabled) {
      setUpdatedYear(NaN);
    }
  }, [isYearEnabled]);

  useEffect(() => {
    const firstFile = files[0];
    if (!firstFile) return;

    if (
      files.every((file) => file.mediaInfo.title === firstFile?.mediaInfo.title)
    ) {
      setUpdatedTitle(firstFile.mediaInfo.title ?? "");
    } else {
      setUpdatedTitle("");
    }

    if (
      files.every(
        (file) => file.mediaInfo.season === firstFile?.mediaInfo.season
      )
    ) {
      setUpdatedSeason(firstFile.mediaInfo.season ?? NaN);
    } else {
      setUpdatedSeason(NaN);
    }

    if (
      files.every(
        (file) => file.mediaInfo.episode === firstFile?.mediaInfo.episode
      )
    ) {
      setUpdatedEpisode(firstFile.mediaInfo.episode ?? NaN);
    } else {
      setUpdatedEpisode(NaN);
    }

    if (
      files.every((file) => file.mediaInfo.year === firstFile?.mediaInfo.year)
    ) {
      setUpdatedYear(firstFile.mediaInfo.year ?? NaN);
    } else {
      setUpdatedYear(NaN);
    }

    if (
      files.every((file) => file.library === firstFile?.library) &&
      firstFile.library.name
    ) {
      setUpdatedLibraryName(new Set([firstFile.library.name]));
    } else {
      setUpdatedLibraryName(undefined);
    }

    setIsEpisodeEnabled(
      files.some((file) => file.mediaInfo.episode !== undefined)
    );
    setIsSeasonEnabled(
      files.some((file) => file.mediaInfo.season !== undefined)
    );
    setIsYearEnabled(files.some((file) => file.mediaInfo.year !== undefined));
    setIncrementEpisodes(false);
  }, [libraries, files]);

  function saveMediaInfo() {
    let counter = 0;

    files.forEach((file) => {
      if (!file.mediaInfo) {
        file.mediaInfo = {};
      }

      if (updatedTitle) file.mediaInfo.title = updatedTitle.trim();

      if (!isSeasonEnabled) file.mediaInfo.season = undefined;
      else if (!isNaN(updatedSeason)) file.mediaInfo.season = updatedSeason;

      if (!isEpisodeEnabled) file.mediaInfo.episode = undefined;
      else if (!isNaN(updatedEpisode))
        file.mediaInfo.episode = updatedEpisode + counter;

      if (!isYearEnabled) file.mediaInfo.year = undefined;
      else if (!isNaN(updatedYear)) file.mediaInfo.year = updatedYear;

      if (updatedLibraryName && updatedLibraryName !== "all") {
        const key = Array.from(updatedLibraryName)[0];
        file.library = libraries.find((library) => library.name === key) ?? {};
      }

      if (incrementEpisodes) counter += 1;
    });

    onClose(true);
  }

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()}>
      <ModalContent>
        <>
          <ModalHeader>Edit selected files</ModalHeader>
          <ModalBody>
            <Input
              label="Title"
              placeholder="(Unchanged)"
              value={updatedTitle}
              type="text"
              onValueChange={setUpdatedTitle}
              radius="sm"
            />

            <NumberInput
              label="Season"
              placeholder={isSeasonEnabled ? "(Unchanged)" : ""}
              value={updatedSeason}
              onValueChange={setUpdatedSeason}
              radius="sm"
              minValue={0}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={isSeasonEnabled}
                  onValueChange={setIsSeasonEnabled}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <NumberInput
              label="Episode"
              placeholder={isEpisodeEnabled ? "(Unchanged)" : ""}
              value={updatedEpisode}
              onValueChange={setUpdatedEpisode}
              radius="sm"
              minValue={0}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={isEpisodeEnabled}
                  onValueChange={setIsEpisodeEnabled}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <Checkbox
              isSelected={incrementEpisodes}
              onValueChange={setIncrementEpisodes}
              size="sm"
              classNames={{ wrapper: "after:bg-emerald-700", label: "text-sm" }}
            >
              Increment episodes
            </Checkbox>

            <NumberInput
              label="Year"
              placeholder={isYearEnabled ? "(Unchanged)" : ""}
              value={updatedYear}
              onValueChange={setUpdatedYear}
              radius="sm"
              minValue={0}
              maxValue={9999}
              formatOptions={numberFormat}
              endContent={
                <Checkbox
                  isSelected={isYearEnabled}
                  onValueChange={setIsYearEnabled}
                  classNames={{ wrapper: "after:bg-emerald-700" }}
                />
              }
            />

            <Select
              label="Media library"
              placeholder="(Unchanged)"
              items={libraries}
              selectedKeys={updatedLibraryName}
              onSelectionChange={setUpdatedLibraryName}
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
              onPress={saveMediaInfo}
            >
              Save
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
