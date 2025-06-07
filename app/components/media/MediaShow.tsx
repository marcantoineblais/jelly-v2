"use client";

import { MediaFile } from "@/app/types/MediaFile";
import { ReactNode, useEffect, useState } from "react";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";
import { AccordionData } from "@/app/types/AccordionData";
import MediaSelectCheckbox from "./MediaSelectCheckbox";
import SingleMedia from "./SingleMedia";

const MediaShow = ({
  label = "",
  files = [],
}: {
  label?: string;
  files: MediaFile[][];
}) => {
  const [title, setTitle] = useState<string | ReactNode>(null);

  useEffect(() => {
    
  }, [files]);

  return (
    <AccordionItem title={title} textValue={label}>
      <Accordion isCompact>
        {showData.map((files) => (
          <AccordionItem
            title={episode.title}
            key={episode.key}
            textValue={episode.textValue}
          >
            {episode.node}
          </AccordionItem>
        ))}
      </Accordion>
    </AccordionItem>
  );
};

export default MediaShow;
