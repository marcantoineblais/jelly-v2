"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ChangeEvent, useMemo } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import MediaCheckbox from "./MediaCheckbox";
import MediaSeason from "./MediaSeason";

export default function MediaShow({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (
    e: ChangeEvent<HTMLInputElement>,
    files: MediaFile | MediaFile[],
  ) => void;
}) {
  // Use useMemo for derived data, but render JSX directly in return
  const uniqueSeasons = useMemo(() => {
    const set = new Set<number | null | undefined>();
    files.forEach((file) => {
      set.add(file.mediaInfo.season);
    });
    return Array.from(set);
  }, [files]);

  return (
    <Accordion isCompact>
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
