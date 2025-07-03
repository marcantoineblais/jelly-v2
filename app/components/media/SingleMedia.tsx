import { createFilename } from "@/app/libs/files/createFilename";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { MediaFile } from "@/app/types/MediaFile";
import MediaInfoLine from "./MediaInfoLine";
import { useMemo } from "react";

export default function SingleMedia({
  file = null,
}: {
  file: MediaFile | null;
}) {
  const lines = useMemo(() => {
    if (!file) return null;
    const filename = createFilename(file.mediaInfo) || "No title";
    const info = file.mediaInfo ?? {};
    const season = info.season ? `${formatNumber(info.season)}` : "None";
    const episode = info.episode ? `${formatNumber(info.episode)}` : "None";
    const year = info.year ? info.year.toString() : "None";
    const type = file.library.type ? file.library.type : "No type";
    return [
      { label: "File path", content: file.path },
      { label: "Original file name", content: file.name },
      { label: "Title", content: filename },
      { label: "Season", content: season },
      { label: "Episode", content: episode },
      { label: "Year", content: year },
      { label: "Media type", content: type },
    ].map(({ label, content }) => (
      <MediaInfoLine key={label} label={label} content={content} />
    ));
  }, [file]);

  return <ul>{lines}</ul>;
}
