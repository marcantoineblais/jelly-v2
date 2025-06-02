"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PressEvent } from "@heroui/react";
import { ChangeEvent, MouseEvent, useState } from "react";
import useModal from "../hooks/useModal";

const MediaSeasonEditor = ({
  title = "Unknown",
  season = null,
  files = [],
  updateFiles = () => {},
}: {
  title?: string;
  season?: number | null;
  files?: MediaFile[];
  updateFiles?: Function;
}) => {
  const [updatedSeason, setUpdatedSeason] = useState<number | null>(season);
  const inputs = [
    {
      label: "Season",
      value: updatedSeason,
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setUpdatedSeason(parseInt(e.currentTarget.value) ?? null),
    },
  ];

  const actions = [
    {
      label: "Cancel",
      handler: (_e: PressEvent, onClose: () => void) => {
        setUpdatedSeason(season);
        onClose();
      },
    },
    {
      label: "Save",
      handler: (_e: PressEvent, onClose: () => void) => {
        onSave();
        onClose();
      },
    },
  ];
  const { onOpen, modal } = useModal(inputs, actions);

  function onSave() {
    const episodes = files.map((episode) => episode);

    episodes.forEach((episode) => {
      if (!episode.mediaInfo) {
        episode.mediaInfo = {};
      }

      episode.mediaInfo.season = updatedSeason;
    });

    updateFiles();
  }

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onOpen();
  }

  return (
    <>
      <div className="flex justify-between gap-3">
        <span>{title}</span>
        <FontAwesomeIcon icon={faPenToSquare} onClick={handleClick} />
      </div>

      {modal}
    </>
  );
};

export default MediaSeasonEditor;
