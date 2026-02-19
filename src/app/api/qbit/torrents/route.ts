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
    const message = err instanceof Error ? err.message : "qBittorrent request failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const magnet = typeof body?.urls === "string" ? body.urls : body?.magnet;
    if (!magnet || typeof magnet !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing urls or magnet in body" },
        { status: 400 },
      );
    }
    await addTorrent(magnet.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Add torrent failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
