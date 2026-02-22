import { listTorrents } from "@/src/libs/qbit/client";
import DownloadsClient from "./DownloadsClient";

export const dynamic = "force-dynamic";

async function getTorrents() {
  try {
    const torrents = await listTorrents();
    return torrents;
  } catch (err) {
    console.error("[downloads] Failed to fetch torrents:", err);
    return [];
  }
}

export default async function DownloadsPage() {
  const initialTorrents = await getTorrents();

  return <DownloadsClient initialTorrents={initialTorrents} />;
}
