import { deleteTorrent } from "@/src/libs/qbit/client";
import { NextResponse } from "next/server";

export async function DELETE(
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
    await deleteTorrent(hash, false);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete torrent failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
