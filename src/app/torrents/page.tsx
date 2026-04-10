import { listTorrents } from "@/src/libs/qbit/client";
import { log } from "@/src/libs/logger";
import TorrentsClient from "./TorrentsClient";

export const dynamic = "force-dynamic";

async function getTorrents() {
  try {
    const torrents = await listTorrents();
    return torrents;
  } catch (err) {
    log({
      source: "torrents/page",
      message: "Failed to fetch torrents",
      data: err,
      level: "error",
    });
    return [];
  }
}

export default async function TorrentsPage() {
  const initialTorrents = await getTorrents();

  return <TorrentsClient initialTorrents={initialTorrents} />;
}
