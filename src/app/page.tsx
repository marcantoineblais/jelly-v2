export const dynamic = "force-dynamic";

import MediaList from "@/src/components/media/MediaList";
import { readFolders } from "@/src/libs/files/readFolders";
import { readConfig } from "@/src/libs/readConfig";
import { ConfigFile } from "@/src/types/ConfigFile";

export default function Home() {
  const { downloadPaths, videosExt, libraries }: ConfigFile = readConfig();
  const files = readFolders(downloadPaths, videosExt, libraries);

  return (
    <main className="h-full max-h-full w-full flex flex-col gap-3 bg-stone-100">
      <MediaList files={files} libraries={libraries} />
    </main>
  );
}
