"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { SortedMedia } from "@/src/types/SortedMedia";
import { Accordion, AccordionItem } from "@heroui/react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import H2 from "../elements/H2";
import H3 from "../elements/H3";
import LibrarySectionContent from "./LibrarySectionContent";

interface MediaListAccordionProps {
  sortedFiles: SortedMedia;
  binnedFiles: SortedMedia;
  selectedKeys: Set<string | number> | "all";
  onSelectionChange: (keys: "all" | Set<string | number>) => void;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
}

export default function MediaListAccordion({
  sortedFiles,
  binnedFiles,
  selectedKeys,
  onSelectionChange,
  onSelect,
}: MediaListAccordionProps) {
  const [binSelectedKeys, setBinSelectedKeys] = useState<
    Set<string | number> | "all"
  >(new Set());

  const libraryItems = Object.entries(sortedFiles).map(([key, files]) => (
    <AccordionItem
      key={key || "not-set"}
      textValue={key || "Not set"}
      classNames={{ titleWrapper: "overflow-hidden" }}
      title={<H2 className="text-left">{key || "Not set"}</H2>}
    >
      <LibrarySectionContent
        sectionKey={key || "not-set"}
        files={files}
        onSelect={onSelect}
      />
    </AccordionItem>
  ));

  const binItem = (
    <AccordionItem
      key="bin"
      textValue="Recycle bin"
      indicator={<FontAwesomeIcon icon={faTrash} size="2x" />}
      disableIndicatorAnimation
    >
      <Accordion
        key="bin-inner"
        isCompact
        selectionMode="multiple"
        selectedKeys={binSelectedKeys}
        onSelectionChange={setBinSelectedKeys}
      >
        {Object.entries(binnedFiles).map(([key, files]) => {
          return (
            <AccordionItem
              key={`bin-${key}`}
              classNames={{ titleWrapper: "overflow-hidden" }}
              textValue={key || "Not set"}
              title={<H3 className="text-left">{key || "Not set"}</H3>}
            >
              <LibrarySectionContent
                sectionKey={`bin-${key}`}
                files={files}
                onSelect={onSelect}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
    </AccordionItem>
  );

  return (
    <div className="h-full overflow-hidden">
      <Accordion
        key="media-list-main"
        className="flex-col h-full overflow-y-auto overflow-x-hidden px-1 py-3"
        onSelectionChange={onSelectionChange}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
      >
        {[...libraryItems, binItem]}
      </Accordion>
    </div>
  );
}
