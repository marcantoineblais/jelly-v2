"use client";

import { AccordionData } from "@/app/types/AccordionData";
import { MediaFile } from "@/app/types/MediaFile";
import { ReactElement, ReactNode, useEffect, useState } from "react";
import MediaEpisodes from "./MediaShow";
import { Accordion, AccordionItem } from "@heroui/react";
import { formatNumber } from "@/app/libs/files/formatNumber";
import SeasonSelectCheckbox from "./SeasonSelectCheckbox";
import SingleMedia from "./SingleMedia";
import MediaSelectCheckbox from "./MediaSelectCheckbox";
import { createFilename } from "@/app/libs/files/createFilename";

const MediaSeason = ({ files = [] }: { files?: MediaFile[] }) => {
  const [title, setTitle] = useState<string | ReactNode>(null);
  const [label, setLabel] = useState<string>("");
  const [items, setItems] = useState<ReactElement[]>([]);
  const [selectedMedias, setSelectedMedias] = useState<boolean[]>(
    files.map((file) => file.isSelected ?? false)
  );

  useEffect(() => {
    if (files.length === 0) return;

    const seasonNumber = files[0].mediaInfo?.season;
    let label = "";
    if (seasonNumber === null) {
      label = "Not set";
    } else if (seasonNumber === 0) {
      label = "Special";
    } else {
      label = `Season ${formatNumber(seasonNumber)}`;
    }
    setLabel(label);
    setTitle(<SeasonSelectCheckbox label={label} files={files} />);
  }, [files]);

  useEffect(() => {
    const seasonData = files.map((file, i) => {
      const label = createFilename(file.mediaInfo) || "Not set";
      
      return (
        <AccordionItem key={i} textValue={label} title={<MediaSelectCheckbox file={file} label={label} />}>
          <SingleMedia file={file} />
        </AccordionItem>
      );
    });

    setItems(seasonData);
  }, [files]);

  return (
    <AccordionItem title={title} textValue={label}>
      <Accordion isCompact>
        {items.map(item => item)};
      </Accordion>
    </AccordionItem>
  );
};

export default MediaSeason;
