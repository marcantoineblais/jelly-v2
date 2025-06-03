"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PressEvent } from "@heroui/react";
import { ChangeEvent, MouseEvent, useState } from "react";
import useModal from "../hooks/useModal";

const MediaSeasonEditor = ({
  label = "Not set",
  title = "",
  season = null,
  files = [],
  updateFiles = () => {},
}: {
  label?: string;
  title?: string;
  season?: number | null;
  files?: MediaFile[];
  updateFiles?: Function;
}) => {
  const [updatedTitle, setUpdatedTitle] = useState<string>(title);
  const [updatedSeason, setUpdatedSeason] = useState<number | null>(season);
  const inputs = [
    {
      label: "Title",
      value: updatedTitle,
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setUpdatedTitle(e.currentTarget.value),
      type: "text",
    },
    {
      label: "Season",
      value: updatedSeason,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const number = parseInt(e.currentTarget.value);
        setUpdatedSeason(isNaN(number) ? null : number);
      },
      type: "number",
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
  const { onOpen, modal } = useModal(
    inputs,
    actions,
    "Title and season number"
  );

  function onSave() {
    const episodes = files.map((episode) => episode);

    episodes.forEach((episode) => {
      if (!episode.mediaInfo) {
        episode.mediaInfo = {};
      }

      episode.mediaInfo.title = updatedTitle;
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
        <label>{label}</label>
        <FontAwesomeIcon icon={faPenToSquare} onClick={handleClick} />
      </div>

      {modal}
    </>
  );
};

export default MediaSeasonEditor;
