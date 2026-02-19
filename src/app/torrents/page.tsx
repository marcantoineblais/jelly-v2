"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, Input, Spinner, addToast } from "@heroui/react";
import Link from "next/link";
import H1 from "@/src/components/elements/H1";

type FeedItem = {
  title: string;
  link: string;
  magnet: string | null;
  pubDate: string;
  pubDateMs: number;
  size: string | null;
  seeds: number | null;
  leech: number | null;
  source: string;
};

type SortBy = "date" | "seeds" | "size";

function formatDate(isoOrRfc: string): string {
  if (!isoOrRfc) return "—";
  const d = new Date(isoOrRfc);
  return Number.isNaN(d.getTime()) ? isoOrRfc : d.toLocaleString();
}

function parseSizeToNum(sizeStr: string | null): number {
  if (!sizeStr) return 0;
  const m = sizeStr.match(/^([\d.]+)\s*(GB|MB|KB)?$/i);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  const u = (m[2] ?? "").toUpperCase();
  if (u === "GB") n *= 1024 * 1024 * 1024;
  else if (u === "MB") n *= 1024 * 1024;
  else if (u === "KB") n *= 1024;
  return n;
}

function getAddableUrl(item: FeedItem): string | null {
  const magnet = item.magnet ?? (item.link?.startsWith("magnet:") ? item.link : null);
  if (magnet) return magnet;
  if (item.link && /\.torrent(\?|$)/i.test(item.link)) return item.link;
  return null;
}

export default function TorrentsPage() {
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("date");

  const sortedItems = useMemo(() => {
    const list = [...items];
    if (sortBy === "date") list.sort((a, b) => b.pubDateMs - a.pubDateMs);
    else if (sortBy === "seeds") list.sort((a, b) => (b.seeds ?? 0) - (a.seeds ?? 0));
    else if (sortBy === "size") list.sort((a, b) => parseSizeToNum(b.size) - parseSizeToNum(a.size));
    return list;
  }, [items, sortBy]);

  const search = useCallback(
    async (searchTitle: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (searchTitle.trim()) params.set("name", searchTitle.trim());
        const res = await fetch(`/api/torrents/feed?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
          setItems([]);
          return;
        }
        setItems(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      search(title);
    },
    [title, search],
  );

  const addToQbit = useCallback(
    async (item: FeedItem, index: number) => {
      const url = getAddableUrl(item);
      if (!url) {
        addToast({
          title: "No link",
          description: "This item has no magnet or torrent link to add.",
          severity: "warning",
        });
        return;
      }
      setAddingIndex(index);
      try {
        const res = await fetch("/api/qbit/torrents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magnet: url }),
        });
        const data = await res.json();
        if (!res.ok) {
          addToast({
            title: "Add failed",
            description: data.error ?? `HTTP ${res.status}`,
            severity: "danger",
          });
          return;
        }
        addToast({
          title: "Added to qBittorrent",
          description: item.title.slice(0, 50) + (item.title.length > 50 ? "…" : ""),
          severity: "success",
        });
      } catch (e) {
        addToast({
          title: "Add failed",
          description: e instanceof Error ? e.message : "Network error",
          severity: "danger",
        });
      } finally {
        setAddingIndex(null);
      }
    },
    [],
  );

  return (
    <main className="min-h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-emerald-700 hover:text-emerald-900 underline"
          >
            ← Home
          </Link>
          <H1 className="text-3xl! mt-0!">Torrents</H1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 p-3 bg-white/80 rounded-lg border border-stone-200"
      >
        <Input
          type="text"
          label="Title"
          placeholder="Search by title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="max-w-md"
          autoComplete="off"
        />
        <Button
          type="submit"
          color="primary"
          isLoading={loading}
          isDisabled={!title.trim()}
        >
          Search
        </Button>
      </form>

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      {loading && items.length === 0 && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-stone-500 text-sm">
          Enter a title and click Search to query Jackett indexers.
        </p>
      )}

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-stone-600 text-sm">
              {items.length} torrent{items.length !== 1 ? "s" : ""} found
            </span>
            <div className="flex items-center gap-2">
              <span className="text-stone-500 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded border border-stone-300 bg-white px-2 py-1 text-sm"
              >
                <option value="date">Date</option>
                <option value="seeds">Seeds</option>
                <option value="size">Size</option>
              </select>
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white/80 overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-100 sticky top-0">
                  <tr>
                    <th className="p-2 font-medium">Title</th>
                    <th className="p-2 font-medium w-28">Date</th>
                    <th className="p-2 font-medium w-20">Size</th>
                    <th className="p-2 font-medium w-16">Seeds</th>
                    <th className="p-2 font-medium w-16">Leech</th>
                    <th className="p-2 font-medium w-24">Source</th>
                    <th className="p-2 font-medium w-40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, i) => {
                    const addUrl = getAddableUrl(item);
                    const openUrl = item.magnet ?? item.link;
                    return (
                      <tr
                        key={`${item.link}-${item.source}-${i}`}
                        className="border-t border-stone-200 hover:bg-stone-50"
                      >
                        <td className="p-2 max-w-[320px] truncate" title={item.title}>
                          {item.title || "—"}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {formatDate(item.pubDate)}
                        </td>
                        <td className="p-2">{item.size ?? "—"}</td>
                        <td className="p-2">{item.seeds ?? "—"}</td>
                        <td className="p-2">{item.leech ?? "—"}</td>
                        <td className="p-2 truncate max-w-[100px]" title={item.source}>
                          {item.source}
                        </td>
                        <td className="p-2 flex flex-wrap gap-1">
                          {addUrl && (
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              isLoading={addingIndex === i}
                              onPress={() => addToQbit(item, i)}
                            >
                              Add to qBittorrent
                            </Button>
                          )}
                          {openUrl && (
                            <Button
                              size="sm"
                              variant="bordered"
                              as="a"
                              href={openUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
