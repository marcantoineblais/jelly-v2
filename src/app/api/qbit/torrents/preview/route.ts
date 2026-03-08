import { NextResponse } from "next/server";
import { deleteTorrent, previewTorrent, QbitTorrentFile } from "@/src/libs/qbit/client";
import { log } from "@/src/libs/logger";

export type TorrentPreviewResponse = {
  ok: boolean;
  hash?: string;
  files?: QbitTorrentFile[];
  alreadyExists?: boolean;
  error?: string;
};

export async function POST(request: Request) {
  let addedHash: string | null = null;

  try {
    const body = await request.json();
    const url = body.url?.trim();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid URL" },
        { status: 400 },
      );
    }

    const preview = await previewTorrent(url);
    if (!preview.alreadyExists) addedHash = preview.hash;

    return NextResponse.json({ ok: true, ...preview });
  } catch (err) {
    if (addedHash) {
      try {
        await deleteTorrent(addedHash, false);
      } catch {
        /* best-effort cleanup */
      }
    }
    log({
      source: "qbit/torrents/preview",
      message: "Preview failed",
      data: err,
      level: "error",
    });
    const message =
      err instanceof Error ? err.message : "Failed to preview torrent";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
