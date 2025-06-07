import { createFilename } from "@/app/libs/files/createFilename";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { MediaFile } from "@/app/types/MediaFile";
import { ReactNode, useEffect, useState } from "react";
import MediaInfoLine from "./MediaInfoLine";

const SingleMedia = ({ file }: { file: MediaFile }) => {
  const [lines, setLines] = useState<ReactNode[]>([]);
  
  useEffect(() => {
    const filename = createFilename(file.mediaInfo) || "No title";
    const info = file.mediaInfo ?? {};
    const season = info.season ? `${formatNumber(info.season)}` : "None";
    const episode = info.episode ? `${formatNumber(info.episode)}` : "None";
    const type = info.type ? info.type : "No type";
    const lines = [
      { label: "File path", content: file.path },
      { label: "Original file name", content: file.name },
      { label: "Title", content: filename },
      { label: "Season", content: season },
      { label: "Episode", content: episode },
      { label: "Media type", content: type },
    ].map(({ label, content }, i) => (
      <MediaInfoLine key={i} label={label} content={content} />
    ));
    
    setLines(lines);
  }, [file])

  return (
    <ul>{lines}</ul>
  )
};

export default SingleMedia;
