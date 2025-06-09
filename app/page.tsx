import H1 from "./components/elements/H1";
import MediaList from "./components/media/MediaList";
import { readFolders } from "./libs/files/readFiles";

const Home = async () => {
  const files = await readFolders();
  
  return (
    <main className="h-full max-h-full w-full flex flex-col gap-3 bg-stone-100">
      <H1 className="mt-5">Jelly</H1>
      <MediaList files={files} />
    </main>
  );
}

export default Home;
