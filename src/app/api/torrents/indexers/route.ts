import {
  getJackettIndexers,
  JackettIndexer,
} from "@/src/libs/torrents/jackett";
import { NextResponse } from "next/server";

export type JackettIndexerResponse = {
  ok: boolean;
  indexers: JackettIndexer[];
  error?: string;
};

export async function GET() {
  try {
    const indexers = await getJackettIndexers();
    return NextResponse.json({ ok: true, indexers });
  } catch (err) {
    console.error("[torrents/indexers] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to fetch Jackett indexers";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
