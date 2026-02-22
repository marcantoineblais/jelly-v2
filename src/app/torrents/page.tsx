import { getJackettIndexers } from "@/src/libs/torrents/jackett";
import TorrentsClient from "./TorrentsClient";

export const dynamic = "force-dynamic";

async function getIndexers() {
  try {
    const result = await getJackettIndexers();
    const indexers = result.indexers;
    return indexers; 
  } catch (err) {
    console.error("[torrents] Failed to fetch indexers:", err);
    return [];
  }
}

export default async function TorrentsPage() {
  const indexers = await getIndexers();

  return <TorrentsClient indexers={indexers} />;
}
