import { getJackettIndexers } from "@/src/libs/downloads/jackett";
import { getShowLibraries } from "@/src/libs/trackers/library";
import { readShows } from "@/src/libs/trackers/storage";
import { log } from "@/src/libs/logger";
import TrackersClient from "./TrackersClient";

export const dynamic = "force-dynamic";

async function getIndexers() {
  try {
    const result = await getJackettIndexers();
    return result.indexers;
  } catch (err) {
    log({
      source: "trackers/page",
      message: "Failed to fetch indexers",
      data: err,
      level: "error",
    });
    return [];
  }
}

export default async function TrackersPage() {
  const [indexers, shows] = await Promise.all([getIndexers(), readShows()]);

  const libraries = getShowLibraries().map((lib) => ({
    name: lib.name ?? "",
    path: lib.path ?? "",
  }));

  return (
    <TrackersClient
      initialShows={shows}
      libraries={libraries}
      indexers={indexers}
    />
  );
}
