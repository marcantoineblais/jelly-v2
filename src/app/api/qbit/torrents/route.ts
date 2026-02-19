import { listTorrents, addTorrent, QbitTorrent } from "@/src/libs/qbit/client";
import { NextResponse } from "next/server";

export type QbittorrentResponse = {
  ok: boolean;
  torrents: QbitTorrent[];
  error?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;
    const reverse = searchParams.get("reverse");
    const torrents = await listTorrents({
      filter,
      sort,
      reverse: reverse === "true",
    });
    return NextResponse.json({ ok: true, torrents });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "qBittorrent request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    await addTorrent(url.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Add torrent failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
