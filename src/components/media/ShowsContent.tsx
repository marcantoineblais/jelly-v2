"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useState } from "react";
import MediaCheckbox from "./MediaCheckbox";
import MediaShow from "./MediaShow";
import Accordion from "../ui/accordion/Accordion";
import AccordionItem from "../ui/accordion/AccordionItem";

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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const uniqueTitles = Array.from(
    new Set(files.map((file) => file.mediaInfo.title || "")),
  );

  return (
    <Accordion
      key={sectionKey}
      selectedItems={selectedKeys}
      setSelectedItems={setSelectedKeys}
      multiple
    >
      {uniqueTitles.map((title, index) => {
        const showFiles = files.filter(
          (file) => file.mediaInfo.title === title,
        );
        const itemKey = title || `untitled-${index}`;

        return (
          <AccordionItem
            id={itemKey}
            key={itemKey}
            header={
              <MediaCheckbox
                files={showFiles}
                label={title || "Not set"}
                isSelected={showFiles.every((file) => file.isSelected)}
                isIndeterminate={showFiles.some((file) => file.isSelected)}
                onSelect={onSelect}
              >
                <span className="text-xs text-gray-500">
                  {showFiles.length} episode{showFiles.length > 1 ? "s" : ""}
                </span>
              </MediaCheckbox>
            }
          >
            <MediaShow files={showFiles} handleSelect={onSelect} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
