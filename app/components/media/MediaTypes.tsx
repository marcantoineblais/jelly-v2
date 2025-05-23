"use client";

import { MediaFile } from "@/app/entities/MediaFile";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import Input from "../elements/Input";

const MediaTypes = ({ files = [] }: { files?: MediaFile[] }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(files);
  const [mediaFileForms, setMediaFileForms] = useState<ReactNode[]>([]);

  useEffect(() => {
    const onChange = (e: FormEvent<HTMLInputElement>, index: number, attribute: string) => {
      setMediaFiles((files) => {
        files[index][attribute] = e.target.value;
        return [...files]
      });
    };
    const nodes = mediaFiles.map((file, i) => {
      const nameInput = (
        <Input
          key={i + "title"}
          name="title"
          label="Title"
          value={file.name}
          onChange={(e) => onChange(e, i, "name")}
        />
      );
      return <div key={i}>{nameInput}</div>;
    });

    setMediaFileForms(nodes);
  }, [mediaFiles]);

  return <div>{mediaFileForms}</div>;
};

export default MediaTypes;
