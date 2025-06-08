"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ChangeEvent } from "react";

const MediaSeason = ({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (e: ChangeEvent<HTMLInputElement>, files: MediaFile[]) => void;
}) => {

  return null;
};

export default MediaSeason;
