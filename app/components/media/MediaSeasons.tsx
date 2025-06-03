"use client";

import { AccordionData } from "@/app/types/AccordionData";
import { MediaFile } from "@/app/types/MediaFile";
import { useEffect, useState } from "react";
import MediaEpisodes from "./MediaEpisodes";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import MediaSeasonEditor from "./MediaSeasonEditor";

const MediaSeasons = ({
  files = {},
  title = "",
  updateFiles = () => {},
}: {
  files: Record<string, MediaFile[]>;
  title?: string;
  updateFiles?: Function;
}) => {
  const [seasons, setSeasons] = useState<AccordionData[]>([]);

  useEffect(() => {
    const seasonsData = Object.entries(files).map(([key, season], i) => {
      let number: number | null = parseInt(key);
      if (isNaN(number)) {
        number = null;
      }

      let label = "";
      if (number === null) {
        label = "Not set";
      } else if (number === 0) {
        label = "Special";
      } else {
        label = `Season ${formatNumber(number)}`;
      }

      return {
        key: i,
        textValue: title,
        title: (
          <MediaSeasonEditor
            key={i}
            label={label}
            title={title}
            files={season}
            updateFiles={updateFiles}
            season={number}
          />
        ),
        node: (
          <MediaEpisodes files={season} key={i} updateFiles={updateFiles} />
        ),
      };
    });

    setSeasons(seasonsData);
  }, [files, title, updateFiles]);

  return (
    <Accordion isCompact>
      {seasons.map(({ key, textValue, title, node }) => {
        return (
          <AccordionItem key={key} title={title} textValue={textValue}>
            {node}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default MediaSeasons;
