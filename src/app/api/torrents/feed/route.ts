import { TORRENT_SORT_BY, TORRENT_SORT_ORDER } from "@/src/config";
import { log } from "@/src/libs/logger";
import { FeedItem, SortBy } from "@/src/libs/torrents/feed-format";
import { searchJackett } from "@/src/libs/torrents/jackett";
import { NextResponse } from "next/server";

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
    const category = searchParams.get("category") ?? "";
    const limitParam = searchParams.get("limit") ?? "";
    const sortBy = searchParams.get("sortBy") ?? "";
    const sortOrder = searchParams.get("sortOrder") ?? "";

    const query = name.trim();
    if (!query && !category) {
      throw new Error("Title or category is required");
    }

    const indexerId = indexerParam.trim().toLowerCase();
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const validLimit =
      limit != null && !Number.isNaN(limit) && limit > 0 ? limit : undefined;
    const validSortBy = TORRENT_SORT_BY.includes(sortBy) ? sortBy : undefined;
    const validSortOrder = TORRENT_SORT_ORDER.includes(sortOrder) ? sortOrder : undefined;
    const options = {
      cat: category.trim() || undefined,
      limit: validLimit,
      sortBy: validSortBy as SortBy | undefined,
      sortOrder: validSortOrder as "asc" | "desc" | undefined,
    };
    
    const { items, total } = await searchJackett(query, indexerId, options);
    return NextResponse.json({
      ok: true,
      items: items as FeedItem[],
      total,
    });
  } catch (err) {
    log({
      source: "torrents/feed",
      message: "Error: ",
      data: err,
      level: "error",
    });

    const message =
      err instanceof Error ? err.message : "Failed to search torrents";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
