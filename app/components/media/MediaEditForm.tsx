"use client"

import { MediaFile } from "@/app/types/MediaFile"
import { useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";

const MediaEditForm = ({ files }: { files: MediaFile[]}) => {
  const [defaultTitle, setDefaultTitle] = useState<string>("");
  const [defaultSeason, setDefaultSeason] = useState<number | null>(null);
  const [defaultEpisode, setDefaultEpisode] = useState<number | null>(null);
  const [defaultType, setDefaultType] = useState<string>("");
  
  const [updatedTitle, setUpdatedTitle] = useState<string>("");
  const [updatedSeason, setUpdatedSeason] = useState<number | null>(null);
  const [updatedEpisode, setUpdatedEpisode] = useState<number | null>(null);
  const [updatedType, setUpdatedType] = useState<string>("");
  
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  
  function saveMediaInfo() {
    files.forEach((file) => {
      if (!file.mediaInfo) {
        file.mediaInfo = {};
      }

      file.mediaInfo.title = updatedTitle;
      file.mediaInfo.season = updatedSeason;
    });
  }

  return (
    <div>INPUT FORM HERE</div>
  )
}

export default MediaEditForm;