"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { Accordion, AccordionItem } from "@heroui/react";
import { useState } from "react";
import MediaCheckbox from "./MediaCheckbox";
import MediaShow from "./MediaShow";

interface ShowsContentProps {
  sectionKey: string;
  files: MediaFile[];
  onSelect: (selected: boolean, updatedFiles: MediaFile | MediaFile[]) => void;
}

export default function ShowsContent({
  sectionKey,
  files,
  onSelect,
}: ShowsContentProps) {
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >(new Set());

  const uniqueTitles = Array.from(
    new Set(files.map((file) => file.mediaInfo.title || "")),
  );

  return (
    <Accordion
      key={sectionKey}
      isCompact
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) =>
        setSelectedKeys(keys === "all" ? "all" : new Set(keys))
      }
    >
      {uniqueTitles.map((title, index) => {
        const showFiles = files.filter(
          (file) => file.mediaInfo.title === title,
        );
        const itemKey = title || `untitled-${index}`;

        return (
          <AccordionItem
            key={itemKey}
            textValue={title}
            classNames={{ titleWrapper: "overflow-hidden" }}
            title={
              <MediaCheckbox
                files={showFiles}
                label={title}
                isSelected={showFiles.every((file) => file.isSelected)}
                isIndeterminate={showFiles.some((file) => file.isSelected)}
                onSelect={onSelect}
              />
            }
          >
            <MediaShow files={showFiles} handleSelect={onSelect} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
