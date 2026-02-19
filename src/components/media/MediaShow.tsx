"use client";

import { MediaFile } from "@/src/types/MediaFile";
import { useMemo, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/src/libs/files/formatNumber";
import MediaCheckbox from "./MediaCheckbox";
import MediaSeason from "./MediaSeason";

export default function MediaShow({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (selected: boolean, files: MediaFile | MediaFile[]) => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<
    Set<string | number> | "all"
  >(new Set());

  const uniqueSeasons = useMemo(() => {
    const set = new Set<number | null | undefined>();
    files.forEach((file) => {
      set.add(file.mediaInfo.season);
    });
    return Array.from(set);
  }, [files]);

  const accordionKey = useMemo(
    () =>
      `show-${files
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
      {uniqueSeasons.map((season) => {
        const formattedSeason =
          season != null ? formatNumber(season) : undefined;
        const label = formattedSeason ? `Season ${formattedSeason}` : "Not set";
        const seasonFiles = files.filter(
          (file) => season === file.mediaInfo.season,
        );
        const key = `${season ?? "notset"}-${seasonFiles[0]?.id ?? ""}`;
        return (
          <AccordionItem
            key={key}
            textValue={label}
            classNames={{ titleWrapper: "overflow-hidden" }}
            title={
              <MediaCheckbox
                files={seasonFiles}
                label={label}
                isSelected={seasonFiles.every((file) => file.isSelected)}
                isIndeterminate={seasonFiles.some((file) => file.isSelected)}
                onSelect={handleSelect}
              />
            }
          >
            <MediaSeason files={seasonFiles} handleSelect={handleSelect} />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
