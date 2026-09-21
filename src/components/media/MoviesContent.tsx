"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useState } from "react";
import { createFilename } from "@/src/libs/files/createFilename";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";
import Accordion from "../ui/accordion/Accordion";
import AccordionItem from "../ui/accordion/AccordionItem";

interface MoviesContentProps {
  sectionKey: string;
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
}

export default function MoviesContent({
  sectionKey,
  files,
  onSelect,
}: MoviesContentProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  return (
    <Accordion
      key={sectionKey}
      selectedItems={selectedKeys}
      setSelectedItems={setSelectedKeys}
      multiple
    >
      {files.map((file) => {
        const label = createFilename(file.mediaInfo);

        return (
          <AccordionItem
            key={file.id}
            id={file.id.toString()}
            header={
              <MediaCheckbox
                files={file}
                label={label || "Not set"}
                isSelected={file.isSelected}
                onSelect={onSelect}
              />
            }
          >
            <SingleMedia file={file} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
