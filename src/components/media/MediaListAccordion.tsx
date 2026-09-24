"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { SortedMedia } from "@/src/types/SortedMedia";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import H2 from "../elements/H2";
import H3 from "../elements/H3";
import LibrarySectionContent from "./LibrarySectionContent";
import Accordion from "../ui/accordion/Accordion";
import AccordionItem from "../ui/accordion/AccordionItem";

interface MediaListAccordionProps {
  sortedFiles: SortedMedia;
  binnedFiles: SortedMedia;
  selectedItems: Set<string>;
  setSelectedItems: (keys: Set<string>) => void;
  onSelect: (selected: boolean, files: MediaFile | MediaFile[]) => void;
}

export default function MediaListAccordion({
  sortedFiles,
  binnedFiles,
  selectedItems,
  setSelectedItems,
  onSelect,
}: MediaListAccordionProps) {
  const [binSelectedKeys, setBinSelectedKeys] = useState<Set<string>>(
    new Set(),
  );

  const libraryItems = Object.entries(sortedFiles).map(([key, files]) => (
    <AccordionItem
      key={key || "not-set"}
      id={key || "not-set"}
      header={<H2 className="text-left">{key || "Not set"}</H2>}
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
      id="bin"
      className="data-main-accordion:shadow-none"
      hideChevron
      header={
        <div className="w-full text-right">
          <FontAwesomeIcon icon={faTrash} size="1x" />
        </div>
      }
    >
      <Accordion
        key="bin-inner"
        selectedItems={binSelectedKeys}
        setSelectedItems={setBinSelectedKeys}
        multiple
      >
        {Object.entries(binnedFiles).map(([key, files]) => {
          return (
            <AccordionItem
              id={`bin-${key}`}
              key={`bin-${key}`}
              header={<H3 className="text-left">{key || "Not set"}</H3>}
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
    <Accordion
      key="media-list-main"
      className="h-full overflow-y-auto overflow-x-hidden"
      setSelectedItems={setSelectedItems}
      selectedItems={selectedItems}
      multiple
    >
      {[...libraryItems, binItem]}
    </Accordion>
  );
}
