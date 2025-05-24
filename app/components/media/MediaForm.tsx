import { MediaFile } from "@/app/entities/MediaFile"
import { Accordion, AccordionItem } from "@heroui/accordion";
import { useEffect, useState } from "react";

const MediaForm = ({ file }: { file: MediaFile}) => {
  const [generatedFilename, setGeneratedFilename] = useState<string>("");

  useEffect(() => {
    if (file.mediaInfo) {
      const info = file.mediaInfo;
      const title = info.title;
      const year = info.year ? ` (${info.year})` : ""
      const episode = info.episode ? ` - ${info.episode}` : ""
      setGeneratedFilename(`${title}${year}${episode}`);
    }
  }, [file])

  return (
    <Accordion isCompact className="w-full">
      <AccordionItem key="1" aria-label="generated filename" title={generatedFilename}>
        
      </AccordionItem>
    </Accordion> 
  )
}

export default MediaForm;