"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ChangeEvent, JSX, useEffect, useState } from "react";
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
  const [nodes, setNodes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const uniqueSeasons = new Set<number | null | undefined>();
    files.forEach((file) => {
      const season = file.mediaInfo.season;
      uniqueSeasons.add(season);
    });

    const nodes = Array.from(uniqueSeasons).map((season, i) => {
      const formattedSeason = formatNumber(season);
      const label = formattedSeason ? `Season ${formattedSeason}` : "Not set";
      const seasonFiles = files.filter((file) => {
        return season === file.mediaInfo.season;
      });

      return (
        <AccordionItem
          key={i}
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
    });

    setNodes(nodes);
  }, [files, handleSelect]);

  return <Accordion isCompact>{nodes}</Accordion>;
}
