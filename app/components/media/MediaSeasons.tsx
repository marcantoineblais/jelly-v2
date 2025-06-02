"use client"

import { AccordionData } from "@/app/types/AccordionData";
import { MediaFile } from "@/app/types/MediaFile"
import { ReactNode, useEffect, useState } from "react";
import MediaEpisodes from "./MediaEpisodes";
import { Accordion, AccordionItem } from "@heroui/react";

const MediaSeasons = ({ files = {} }: { files: Record<string, MediaFile[]>}) => {
  const [seasons, setSeasons] = useState<AccordionData[]>([]);

  useEffect(() => {
    const seasonsData = Object.entries(files).map(([title, season], i) => {
      return {
        key: i,
        title: title,
        node: <MediaEpisodes files={season} key={i} />
      }
    })

    setSeasons(seasonsData);
  }, [files])

  return (
    <Accordion isCompact>
      {seasons.map(({ key, title, node }) => {
        return <AccordionItem key={key} title={title}>{node}</AccordionItem>
      })}
    </Accordion>
  )
}

export default MediaSeasons;