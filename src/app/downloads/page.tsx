import { getJackettIndexers } from "@/src/libs/downloads/jackett";
import { log } from "@/src/libs/logger";
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
    log({ source: "downloads/page", message: "Failed to fetch indexers", data: err, level: "error" });
    return [];
  }
}

export default async function DownloadsPage() {
  const indexers = await getIndexers();

  return <DownloadsClient indexers={indexers} />;
}
