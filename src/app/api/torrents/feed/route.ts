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
    const indexersParam = searchParams.get("indexers") ?? "";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

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

    const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    );
    const offset = (page - 1) * limit;

    const indexerIds = indexersParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { items, total } = await searchJackett(query, indexerIds, {
      offset,
      limit,
    });
    return NextResponse.json({
      ok: true,
      items: items as FeedItem[],
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error("[torrents/feed] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to search torrents";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
