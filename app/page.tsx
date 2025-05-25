import H1 from "./components/elements/H1";
import MediaList from "./components/media/MediaList";
import { readFolders } from "./libs/files/readFiles";

const Home = async () => {
  const files = await readFolders();
  
  return (
    <main className="py-5 px-1 h-full w-full">
      <H1>Jelly</H1>
      <MediaList files={files} />
    </main>
  );
}

export default Home;
