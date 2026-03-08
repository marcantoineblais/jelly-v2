import { deleteTorrent, getTorrentFiles, pauseTorrent, resumeTorrent } from "@/src/libs/qbit/client";
import { log } from "@/src/libs/logger";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params;
    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "Missing torrent hash" },
        { status: 400 },
      );
    }
    const files = (await getTorrentFiles(hash)) ?? [];
    return NextResponse.json({ ok: true, files });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get files";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params;
    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "Missing torrent hash" },
        { status: 400 },
      );
    }
    const { searchParams } = new URL(request.url);
    const deleteFiles = searchParams.get("deleteFiles") === "true";
    await deleteTorrent(hash, deleteFiles);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log({ source: "qbit/torrents/[hash]", message: "Failed to delete torrent", data: err, level: "error" });
    const message = err instanceof Error ? err.message : "Delete torrent failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ hash: string }> },
) {
  try {
    const { hash } = await params;
    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "Missing torrent hash" },
        { status: 400 },
      );
    }
    const body = await request.json().catch(() => ({}));
    const action: string = body.action ?? "resume";

    if (action === "pause") {
      await pauseTorrent(hash);
    } else {
      await resumeTorrent(hash);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    log({ source: "qbit/torrents/[hash]", message: "Failed to update torrent", data: err, level: "error" });
    const message = err instanceof Error ? err.message : "Update torrent failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
