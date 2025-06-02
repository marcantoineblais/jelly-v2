"use client";

import { AccordionData } from "@/app/types/AccordionData";
import { MediaFile } from "@/app/types/MediaFile";
import { useEffect, useState } from "react";
import MediaEpisodes from "./MediaEpisodes";
import { Accordion, AccordionItem } from "@heroui/react";

const MediaSeasons = ({
  files = {},
  updateFiles = () => {},
}: {
  files: Record<string, MediaFile[]>;
  updateFiles?: Function;
}) => {
  const [seasons, setSeasons] = useState<AccordionData[]>([]);

  useEffect(() => {
    const seasonsData = Object.entries(files).map(([title, season], i) => {
      return {
        key: i,
        title: title,
        node: <MediaEpisodes files={season} key={i} updateFiles={updateFiles} />,
      };
    });

    setSeasons(seasonsData);
  }, [files]);

  return (
    <Accordion isCompact>
      {seasons.map(({ key, title, node }) => {
        return (
          <AccordionItem key={key} title={title}>
            {node}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default MediaSeasons;
