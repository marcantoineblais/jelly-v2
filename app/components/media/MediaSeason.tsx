"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { Accordion, AccordionItem } from "@heroui/react";
import { ChangeEvent, JSX, useEffect, useState } from "react";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";
import { createFilename } from "@/app/libs/files/createFilename";

export default function MediaSeason({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (
    e: ChangeEvent<HTMLInputElement>,
    files: MediaFile | MediaFile[],
  ) => void;
}) {
  const [nodes, setNodes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const nodes = files.map((file, i) => {
      const label = createFilename(file.mediaInfo) ?? "Not set";

      return (
        <AccordionItem
          key={i}
          textValue={label}
          title={
            <MediaCheckbox
              files={file}
              label={label}
              isSelected={file.isSelected}
              onSelect={handleSelect}
            />
          }
        >
          <SingleMedia file={file} />
        </AccordionItem>
      );
    });

    setNodes(nodes);
  }, [files, handleSelect]);

  return <Accordion isCompact>{nodes}</Accordion>;
}
