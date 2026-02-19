"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { Accordion, AccordionItem } from "@heroui/react";
import { useMemo, useState } from "react";
import MediaCheckbox from "./MediaCheckbox";
import SingleMedia from "./SingleMedia";
import { createFilename } from "@/src/libs/files/createFilename";

export default function MediaSeason({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >(new Set());

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
      isCompact
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
    >
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
