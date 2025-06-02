"use client"

import { MediaFile } from "@/app/types/MediaFile"
import { useEffect, useState } from "react";
import MediaForm from "./MediaForm";
import { AccordionData } from "@/app/types/AccordionData";
import { createFilename } from "@/app/libs/files/createFilename";
import { Accordion, AccordionItem } from "@heroui/react";

const MediaEpisodes = ({ files = [] }: { files: MediaFile[]}) => {
  const [episodes, setEpisodes] = useState<AccordionData[]>([]);

  useEffect(() => {
    const episodesData = files.map((episode, i) => {
      const title = createFilename(episode.mediaInfo);
    
      return {
        key: i,
        title: title,
        node: <MediaForm file={episode} key={i} />
      }
    })

    setEpisodes(episodesData)
  }, [files])

  return (
    <Accordion isCompact>
      {episodes.map(({ key, title, node }) => {
        return <AccordionItem key={key} title={title}>{node}</AccordionItem>
      })}
    </Accordion>
  )
}

export default MediaEpisodes;