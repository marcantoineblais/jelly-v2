import { listTorrents } from "@/src/libs/qbit/client";
import TorrentsClient from "./TorrentsClient";

export const dynamic = "force-dynamic";

async function getTorrents() {
  try {
    const torrents = await listTorrents();
    return torrents;
  } catch (err) {
    console.error("[torrents] Failed to fetch torrents:", err);
    return [];
  }
}

export default async function TorrentsPage() {
  const initialTorrents = await getTorrents();

  return <TorrentsClient initialTorrents={initialTorrents} />;
}
