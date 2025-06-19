"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { MediaLibrary } from "@/app/types/MediaLibrary";
import {
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
} from "@heroui/react";
import { useEffect, useState } from "react";

export default function MediaEditForm({
  files = [],
  libraries = [],
  isOpen = false,
  onClose = () => {},
}: {
  files: MediaFile[];
  libraries?: MediaLibrary[];
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [defaultTitle, setDefaultTitle] = useState<string | undefined>();
  const [defaultSeason, setDefaultSeason] = useState<number | undefined>();
  const [defaultEpisode, setDefaultEpisode] = useState<number | undefined>();
  const [defaultYear, setDefaultYear] = useState<number | undefined>();
  const [defaultLibrary, setDefaultLibrary] = useState<MediaLibrary>();

  const [updatedTitle, setUpdatedTitle] = useState<string | undefined>();
  const [updatedSeason, setUpdatedSeason] = useState<number | undefined>();
  const [updatedEpisode, setUpdatedEpisode] = useState<number | undefined>();
  const [updatedYear, setUpdatedYear] = useState<number | undefined>();
  const [updatedLibrary, setUpdatedLibrary] = useState<MediaLibrary>();
  const [incrementEpisodes, setIncrementEpisodes] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const firstFile = files[0];
    if (
      files.every((file) => file.mediaInfo.title === firstFile?.mediaInfo.title)
    ) {
      setDefaultTitle(firstFile.mediaInfo.title);
      setUpdatedTitle(firstFile.mediaInfo.title);
    } else {
      setDefaultTitle(undefined);
      setUpdatedTitle(undefined);
    }

    if (
      files.every(
        (file) => file.mediaInfo.season === firstFile?.mediaInfo.season
      )
    ) {
      setDefaultSeason(firstFile.mediaInfo.season);
      setUpdatedSeason(firstFile.mediaInfo.season);
    } else {
      setDefaultSeason(undefined);
      setUpdatedSeason(undefined);
    }

    if (
      files.every(
        (file) => file.mediaInfo.episode === firstFile?.mediaInfo.episode
      )
    ) {
      setDefaultEpisode(firstFile.mediaInfo.episode);
      setUpdatedEpisode(firstFile.mediaInfo.episode);
    } else {
      setDefaultEpisode(undefined);
      setUpdatedEpisode(undefined);
    }

    if (
      files.every((file) => file.mediaInfo.year === firstFile?.mediaInfo.year)
    ) {
      setDefaultYear(firstFile.mediaInfo.year);
      setUpdatedYear(firstFile.mediaInfo.year);
    } else {
      setDefaultYear(undefined);
      setUpdatedYear(undefined);
    }

    if (files.every((file) => file.library === firstFile?.library)) {
      setDefaultLibrary(firstFile.library);
      setUpdatedLibrary(firstFile.library);
    } else {
      setDefaultLibrary(undefined);
      setUpdatedLibrary(undefined);
    }
  }, [isOpen, libraries, files]);

  function saveMediaInfo() {
    let counter = 0;

    files.forEach((file) => {
      if (!file.mediaInfo) {
        file.mediaInfo = {};
      }

      if (updatedTitle) file.mediaInfo.title = updatedTitle;
      if (updatedSeason) file.mediaInfo.season = updatedSeason;
      if (updatedEpisode) file.mediaInfo.episode = updatedEpisode + counter;
      if (updatedYear) file.mediaInfo.year = updatedYear;
      if (updatedLibrary) file.library = updatedLibrary;

      if (incrementEpisodes) counter += 1;
    });

    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <>
          <ModalHeader>Edit selected files</ModalHeader>
          <ModalBody>
            <Input
              label="Title"
              defaultValue={defaultTitle ?? "(Unchanged)"}
              value={updatedTitle ?? ""}
              type="text"
              onValueChange={setUpdatedTitle}
              radius="sm"
              classNames={{
                label: "group-data-[filled-within=true]:-translate-y-[75%]",
                input: "focus:outline-none",
              }}
            />

            <NumberInput
              label="Season"
              defaultValue={defaultSeason}
              value={updatedSeason}
              type="number"
              onValueChange={setUpdatedSeason}
              radius="sm"
              minValue={0}
              classNames={{
                label: "group-data-[filled-within=true]:-translate-y-[75%]",
                input: "focus:outline-none",
              }}
              formatOptions={{}}
            />

            <NumberInput
              label="Episode"
              defaultValue={defaultEpisode}
              value={updatedEpisode}
              type="number"
              onValueChange={setUpdatedEpisode}
              radius="sm"
              minValue={0}
              classNames={{
                label: "group-data-[filled-within=true]:-translate-y-[75%]",
                input: "focus:outline-none",
              }}
              formatOptions={{}}
            />

            <NumberInput
              label="Year"
              defaultValue={defaultYear}
              value={updatedYear}
              type="number"
              onValueChange={setUpdatedYear}
              radius="sm"
              classNames={{
                label: "group-data-[filled-within=true]:-translate-y-[75%]",
                input: "focus:outline-none",
              }}
              formatOptions={{}}
            />

            <Select
              label="Media library"
              placeholder={defaultLibrary?.name ?? "(Unchanged)"}
              items={libraries}
              defaultSelectedKeys={defaultLibrary?.name}
              onChange={(e) =>
                setUpdatedLibrary(
                  libraries.find(
                    (library) => library.name === e.currentTarget.value
                  )
                )
              }
              radius="sm"
              classNames={{
                label: "group-data-[filled-within=true]:-translate-y-[75%]",
                listbox: "focus:outline-none",
              }}
            >
              {(library) => (
                <SelectItem key={library.name}>{library.name}</SelectItem>
              )}
            </Select>
          </ModalBody>

          <ModalFooter>
            <Button onPress={onClose}>Cancel</Button>
            <Button onPress={saveMediaInfo}>Save</Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
