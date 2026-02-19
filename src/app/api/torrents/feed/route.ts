import { FeedItem } from "@/src/libs/torrents/feed-format";
import { searchJackett } from "@/src/libs/torrents/jackett";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export type FeedResponse = {
  ok: boolean;
  items: FeedItem[];
  total: number | null;
  page: number;
  limit: number;
  error?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? searchParams.get("q") ?? "";
    const indexerParam = searchParams.get("indexers") ?? "";

    const query = name.trim();
    if (!query) {
      return NextResponse.json({
        ok: true,
        items: [],
        total: null,
        page: 1,
        limit: DEFAULT_LIMIT,
      });
    }

    const indexerId = indexerParam.trim().toLowerCase();

    const { items, total } = await searchJackett(query, indexerId);
    return NextResponse.json({
      ok: true,
      items: items as FeedItem[],
      total,
    });
  } catch (err) {
    console.error("[torrents/feed] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to search torrents";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
