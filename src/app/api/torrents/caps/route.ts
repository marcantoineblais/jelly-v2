import {
  getJackettCaps,
  TorznabCaps,
} from "@/src/libs/torrents/jackett";
import { NextResponse } from "next/server";

export type CapsResponse = {
  ok: boolean;
  caps: TorznabCaps;
  error?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const indexer = searchParams.get("indexer") ?? searchParams.get("indexerId") ?? "all";

    const caps = await getJackettCaps(indexer);
    return NextResponse.json({ ok: true, caps });
  } catch (err) {
    console.error("[torrents/caps] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch Jackett caps";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
