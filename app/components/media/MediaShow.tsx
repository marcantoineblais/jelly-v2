"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ChangeEvent, JSX, useEffect, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import MediaCheckbox from "./MediaCheckbox";
import MediaSeason from "./MediaSeason";

const MediaShow = ({
  files = [],
  handleSelect = () => {},
}: {
  files?: MediaFile[];
  handleSelect?: (e: ChangeEvent<HTMLInputElement>, files: MediaFile[]) => void;
}) => {
  const [nodes, setNodes] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const uniqueSeasons = new Set<string>();
    files.forEach((file) => {
      const season = file.mediaInfo.season;
      uniqueSeasons.add(formatNumber(season) ?? "");
    });

    const nodes = Array.from(uniqueSeasons).map((season, i) => {
      const label = season ? `Season ${season}` : "Not set";
      const seasonFiles = files.filter((file) => {
        const mediaSeason = formatNumber(file.mediaInfo.season) || "";
        return season === mediaSeason;
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
};

export default MediaShow;
