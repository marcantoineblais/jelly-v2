import H1 from "./components/elements/H1";
import MediaList from "./components/media/MediaList";
import { readFolders } from "./libs/files/readFiles";
import { readConfig } from "./libs/readConfig";
import { ConfigFile } from "./types/ConfigFile";

export default function Home() {
  const { downloadPaths, videosExt, libraries }: ConfigFile = readConfig();
  const files = readFolders(downloadPaths, videosExt, libraries);

  return (
    <main className="h-full max-h-full w-full flex flex-col gap-3 bg-stone-100">
      <H1 className="mt-5">Jelly</H1>
      <MediaList files={files} libraries={libraries} />
    </main>
  );
}
