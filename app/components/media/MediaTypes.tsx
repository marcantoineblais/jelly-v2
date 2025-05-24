"use client";

import { MediaFile } from "@/app/entities/MediaFile";
import { ReactNode, useEffect, useState } from "react";
import MediaForm from "./MediaForm";

const MediaTypes = ({ files = [] }: { files?: MediaFile[] }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(files);
  const [mediaFileForms, setMediaFileForms] = useState<ReactNode[]>([]);

  useEffect(() => {
    const nodes = mediaFiles.map((file, i) => <MediaForm file={file} key={i} />)
    setMediaFileForms(nodes);
  }, [mediaFiles]);

  return <div>{mediaFileForms}</div>;
};

export default MediaTypes;
