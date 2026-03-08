import { listTorrents, addTorrent, QbitTorrent } from "@/src/libs/qbit/client";
import { NextResponse } from "next/server";
import { withHandler } from "@/src/libs/api/handler";

export type QbittorrentResponse = {
  ok: boolean;
  torrents: QbitTorrent[];
  error?: string;
};

export const GET = withHandler(
  "qbit/torrents",
  async (request: Request) => {
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
  },
  { status: 502 },
);

export const POST = withHandler(
  "qbit/torrents",
  async (request: Request) => {
    const body = await request.json();
    const url = body.url?.trim();
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL");
    }

    await addTorrent(url);
    return NextResponse.json({ ok: true });
  },
  { status: 502 },
);
