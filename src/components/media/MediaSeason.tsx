"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useMemo, useState } from "react";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";
import { createEpisodeLabel } from "@/src/libs/files/createFilename";
import AccordionItem from "../ui/accordion/AccordionItem";
import Accordion from "../ui/accordion/Accordion";

export default function MediaSeason({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const accordionKey = useMemo(
    () =>
      `season-${files
        .map((f) => f.id)
        .sort((a, b) => a - b)
        .join(",")}`,
    [files],
  );

  return (
    <Accordion
      key={accordionKey}
      selectedItems={selectedKeys}
      setSelectedItems={setSelectedKeys}
    >
      {files.map((file) => {
        const label = file.mediaInfo.title ?? "No title";
        return (
          <AccordionItem
            key={file.id}
            id={file.id.toString()}
            header={
              <MediaCheckbox
                files={file}
                label={label}
                isSelected={file.isSelected}
                onSelect={handleSelect}
              >
                <span className="text-xs text-gray-500">
                  {createEpisodeLabel(file.mediaInfo)}
                </span>
              </MediaCheckbox>
            }
          >
            <SingleMedia file={file} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
