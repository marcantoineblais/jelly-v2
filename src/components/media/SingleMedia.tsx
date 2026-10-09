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
  const season = info.season != null ? formatNumber(info.season) : "None";
  const episode = info.episode != null ? formatNumber(info.episode) : "None";
  const year = info.year ? info.year.toString() : "None";
  const type = file.library?.type ?? "—";
  const fileSize = file.size != null ? formatDataSize(file.size) : "Unknown";

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
      <MediaInfoLine
        className="col-span-2 sm:col-span-4"
        label="New name"
        content={`${filename}${file.ext ?? ""}`}
        mono
      />
      <MediaInfoLine
        className="col-span-2 sm:col-span-4"
        label="Original file"
        content={`${file.name}${file.ext ?? ""}`}
        mono
      />
      <MediaInfoLine
        className="col-span-2 sm:col-span-4"
        label="Path"
        content={file.path}
        mono
      />
      <MediaInfoLine label="Season" content={season} />
      <MediaInfoLine label="Episode" content={episode} />
      <MediaInfoLine label="Year" content={year} />
      <MediaInfoLine label="Size" content={fileSize} />
      <MediaInfoLine label="Library" content={file.library?.name ?? "—"} />
      <MediaInfoLine label="Type" content={type} />
    </dl>
  );
}
