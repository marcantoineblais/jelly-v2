import { createFilename } from "@/src/libs/files/createFilename";
import { formatNumber } from "@/src/libs/files/formatNumber";
import { MediaFile } from "@/src/types/MediaFile";
import MediaInfoLine from "./MediaInfoLine";
import { formatDataSize } from "@/src/libs/format-data-size";

export default function SingleMedia({
  file = null,
}: {
  file: MediaFile | null;
}) {
  if (!file) return null;

  const filename = createFilename(file.mediaInfo) || "No title";
  const info = file.mediaInfo ?? {};
  const season = info.season ? `${formatNumber(info.season)}` : "None";
  const episode = info.episode ? `${formatNumber(info.episode)}` : "None";
  const year = info.year ? info.year.toString() : "None";
  const type = file.library?.type ?? "";
  const fileSize = file.size != null ? formatDataSize(file.size) : "Unknown";
  const elements = [
    { label: "File path", content: file.path },
    { label: "Original file name", content: file.name },
    { label: "Title", content: filename },
    { label: "Season", content: season },
    { label: "Episode", content: episode },
    { label: "Year", content: year },
    { label: "File size", content: fileSize },
    { label: "Media type", content: type },
  ];

  return (
    <ul>
      {elements.map(({ label, content }) => (
        <MediaInfoLine key={label} label={label} content={content} />
      ))}
    </ul>
  );
}
