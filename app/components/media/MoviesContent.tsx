"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { Accordion, AccordionItem } from "@heroui/react";
import { createFilename } from "@/app/libs/files/createFilename";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";

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
  return (
    <Accordion key={sectionKey} isCompact>
      {files.map((file) => {
        const title = file.mediaInfo.title || "Not set";
        const label = createFilename(file.mediaInfo);

        return (
          <AccordionItem
            key={file.id || file.path || label}
            textValue={title}
            classNames={{ titleWrapper: "overflow-hidden" }}
            title={
              <MediaCheckbox
                files={file}
                label={label}
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
