import { getJackettIndexers } from "@/src/libs/torrents/jackett";
import { getShowLibraries } from "@/src/libs/shows/library";
import { readShows } from "@/src/libs/shows/storage";
import ShowsClient from "./ShowsClient";

export const dynamic = "force-dynamic";

async function getIndexers() {
  try {
    const result = await getJackettIndexers();
    return result.indexers;
  } catch (err) {
    console.error("[shows] Failed to fetch indexers:", err);
    return [];
  }
}

export default async function ShowsPage() {
  const [indexers, shows] = await Promise.all([getIndexers(), readShows()]);

  const libraries = getShowLibraries().map((lib) => ({
    name: lib.name ?? "",
    path: lib.path ?? "",
  }));

  return (
    <ShowsClient
      initialShows={shows}
      libraries={libraries}
      indexers={indexers}
    />
  );
}
