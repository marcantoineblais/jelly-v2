"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { Accordion, AccordionItem } from "@heroui/react";
import { ChangeEvent } from "react";
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
    files: MediaFile | MediaFile[]
  ) => void;
}) {
  return (
    <Accordion isCompact>
      {files.map((file) => {
        const label = createFilename(file.mediaInfo) ?? "Not set";
        return (
          <AccordionItem
            key={file.id}
            textValue={label}
            classNames={{ titleWrapper: "overflow-hidden" }}
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
      })}
    </Accordion>
  );
}
