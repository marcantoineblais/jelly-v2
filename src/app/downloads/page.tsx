import { getJackettIndexers } from "@/src/libs/downloads/jackett";
import DownloadsClient from "./DownloadsClient";

export const dynamic = "force-dynamic";

async function getIndexers() {
  try {
    const result = await getJackettIndexers();
    const indexers = result.indexers.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return indexers;
  } catch (err) {
    console.error("[downloads] Failed to fetch indexers:", err);
    return [];
  }
}

export default async function DownloadsPage() {
  const indexers = await getIndexers();

  return <DownloadsClient indexers={indexers} />;
}
