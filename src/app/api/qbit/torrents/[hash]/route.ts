import {
  deleteTorrent,
  getTorrentFiles,
  pauseTorrent,
  resumeTorrent,
} from "@/src/libs/qbit/client";
import { NextResponse } from "next/server";
import { withHandler } from "@/src/libs/api/handler";

export const GET = withHandler(
  "qbit/torrents/[hash]",
  async (
    _request: Request,
    { params }: { params: Promise<{ hash: string }> },
  ) => {
    const { hash } = await params;
    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "Missing torrent hash" },
        { status: 400 },
      );
    }
    const files = (await getTorrentFiles(hash)) ?? [];
    return NextResponse.json({ ok: true, files });
  },
  { status: 502 },
);

export const DELETE = withHandler(
  "qbit/torrents/[hash]",
  async (
    request: Request,
    { params }: { params: Promise<{ hash: string }> },
  ) => {
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
  },
  { status: 502 },
);

export const PATCH = withHandler(
  "qbit/torrents/[hash]",
  async (
    request: Request,
    { params }: { params: Promise<{ hash: string }> },
  ) => {
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
  },
  { status: 502 },
);
