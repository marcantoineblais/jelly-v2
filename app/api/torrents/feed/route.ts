import {
  parseFeeds,
  getDefaultFeedUrls,
  type FeedTorrentItem,
} from "@/app/libs/torrents/parseFeeds";
import { NextResponse } from "next/server";

type SortKey = "date" | "seed" | "leech" | "title" | "size";
const SORT_KEYS: SortKey[] = ["date", "seed", "leech", "title", "size"];

function sortItems(
  items: FeedTorrentItem[],
  sort: SortKey,
  reverse: boolean,
): FeedTorrentItem[] {
  const mult = reverse ? -1 : 1;
  const arr = [...items];
  switch (sort) {
    case "date":
      arr.sort((a, b) => mult * (b.pubDateMs - a.pubDateMs));
      break;
    case "seed":
      arr.sort(
        (a, b) =>
          mult * ((b.seeds ?? 0) - (a.seeds ?? 0)),
      );
      break;
    case "leech":
      arr.sort(
        (a, b) =>
          mult * ((b.leech ?? 0) - (a.leech ?? 0)),
      );
      break;
    case "title":
      arr.sort((a, b) => mult * a.title.localeCompare(b.title));
      break;
    case "size":
      arr.sort((a, b) => mult * (a.size ?? "").localeCompare(b.size ?? ""));
      break;
    default:
      break;
  }
  return arr;
}

function filterItems(
  items: FeedTorrentItem[],
  nameQuery: string | null,
  typeQuery: string | null,
): FeedTorrentItem[] {
  let out = items;
  if (nameQuery && nameQuery.trim()) {
    const q = nameQuery.trim().toLowerCase();
    out = out.filter((i) => i.title.toLowerCase().includes(q));
  }
  if (typeQuery && typeQuery.trim()) {
    const q = typeQuery.trim().toLowerCase();
    out = out.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.source && i.source.toLowerCase().includes(q)),
    );
  }
  return out;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get("url");
    const urlsParam = searchParams.get("urls");
    const sort = (searchParams.get("sort") ?? "date") as SortKey;
    const reverse = searchParams.get("reverse") === "true";
    const name = searchParams.get("name") ?? searchParams.get("q");
    const type = searchParams.get("type");

    let feedUrls: string[];
    if (urlParam) {
      feedUrls = [urlParam];
    } else if (urlsParam) {
      feedUrls = urlsParam.split(",").map((u) => u.trim()).filter(Boolean);
    } else {
      feedUrls = getDefaultFeedUrls();
    }

    if (feedUrls.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No feed URLs. Set TORRENT_FEED_URLS in env or pass ?url= or ?urls=.",
        },
        { status: 400 },
      );
    }

    let items = await parseFeeds(feedUrls);
    items = filterItems(items, name, type);
    items = sortItems(
      items,
      SORT_KEYS.includes(sort) ? sort : "date",
      reverse,
    );

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch torrent feed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
