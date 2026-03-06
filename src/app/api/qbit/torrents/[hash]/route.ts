import { deleteTorrent } from "@/src/libs/qbit/client";
import { log } from "@/src/libs/logger";
import { NextResponse } from "next/server";

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
