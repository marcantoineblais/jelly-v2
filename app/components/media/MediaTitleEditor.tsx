"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Input, PressEvent } from "@heroui/react";
import { ChangeEvent, MouseEvent, useState } from "react";
import useModal from "../hooks/useModal";

const MediaContentEditor = ({
  title = "",
  files = {},
  updateFiles = () => {},
}: {
  title?: string;
  files?: Record<string, MediaFile[]>;
  updateFiles?: Function;
}) => {
  const [updatedTitle, setUpdatedTitle] = useState<string>(title);
  const inputs = [
    {
      label: "Title",
      value: updatedTitle,
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        setUpdatedTitle(e.currentTarget.value),
    },
  ];

  const actions = [
    {
      label: "Cancel",
      handler: (_e: PressEvent, onClose: () => void) => {
        setUpdatedTitle(title);
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
    const seasons = Object.values(files).map((season) => season);
    const episodes = seasons.map((episode) => episode).flat();

    episodes.forEach((episode) => {
      if (!episode.mediaInfo) {
        episode.mediaInfo = {};
      }

      episode.mediaInfo.title = updatedTitle;
    });

    updateFiles();
  }

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
    onOpen();
  }

  return (
    <div className="flex justify-between gap-3">
      <span>{title}</span>
      <FontAwesomeIcon icon={faPenToSquare} onClick={handleClick} />
      {modal}
    </div>
  );
};

export default MediaContentEditor;
