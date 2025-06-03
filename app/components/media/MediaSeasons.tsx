"use client";

import { AccordionData } from "@/app/types/AccordionData";
import { MediaFile } from "@/app/types/MediaFile";
import { useEffect, useState } from "react";
import MediaEpisodes from "./MediaEpisodes";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";

const MediaSeasons = ({
  files = {},
  title = "",
  selectFile = () => {},
  unSelectFile = () => {},
}: {
  files: Record<string, MediaFile[]>;
  title?: string;
  selectFile?: Function;
  unSelectFile?: Function;
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
        title: title,
        node: (
          <MediaEpisodes files={season} key={i} selectFile={selectFile} unSelectFile={unSelectFile} />
        ),
      };
    });

    setSeasons(seasonsData);
  }, [files, title, selectFile]);

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
