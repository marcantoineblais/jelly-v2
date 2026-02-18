"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Select, SelectItem, Spinner, addToast } from "@heroui/react";
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

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "seed", label: "Seeds" },
  { value: "leech", label: "Leech" },
  { value: "title", label: "Title" },
  { value: "size", label: "Size" },
];

function formatDate(isoOrRfc: string): string {
  if (!isoOrRfc) return "—";
  const d = new Date(isoOrRfc);
  return Number.isNaN(d.getTime()) ? isoOrRfc : d.toLocaleString();
}

export default function TorrentsPage() {
  const [feedUrl, setFeedUrl] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("date");
  const [reverse, setReverse] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (feedUrl.trim()) params.set("url", feedUrl.trim());
      if (nameFilter.trim()) params.set("name", nameFilter.trim());
      if (typeFilter.trim()) params.set("type", typeFilter.trim());
      params.set("sort", sort);
      if (reverse) params.set("reverse", "true");
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
  }, [feedUrl, nameFilter, typeFilter, sort, reverse]);

  useEffect(() => {
    fetchFeed();
  }, [sort, reverse]);

  const addToQbit = useCallback(
    async (item: FeedItem, index: number) => {
      const magnet = item.magnet ?? item.link;
      if (!magnet.startsWith("magnet:")) {
        addToast({
          title: "No magnet link",
          description: "This item has no magnet link to add.",
          severity: "warning",
        });
        return;
      }
      setAddingIndex(index);
      try {
        const res = await fetch("/api/qbit/torrents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magnet }),
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

      <section className="flex flex-wrap items-end gap-3 p-3 bg-white/80 rounded-lg border border-stone-200">
        <Input
          label="Feed URL"
          placeholder="Optional: override default feeds from config.ts"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
          className="max-w-md"
        />
        <Input
          label="Name"
          placeholder="Filter by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="max-w-[200px]"
        />
        <Input
          label="Type"
          placeholder="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="max-w-[200px]"
        />
        <Select
          label="Sort"
          selectedKeys={[sort]}
          onSelectionChange={(keys) => {
            const v = Array.from(keys)[0];
            if (v) setSort(String(v));
          }}
          className="max-w-[120px]"
        >
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value}>{o.label}</SelectItem>
          ))}
        </Select>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={reverse}
            onChange={(e) => setReverse(e.target.checked)}
          />
          <span className="text-sm">Reverse</span>
        </label>
        <Button color="primary" onPress={fetchFeed} isLoading={loading}>
          {feedUrl.trim() ? "Refresh" : "Load feed (enter URL)"}
        </Button>
      </section>

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
          Enter a feed URL above and click Load, or use default feeds from
          src/config.ts (TORRENT_FEED_URLS) and refresh.
        </p>
      )}

      {items.length > 0 && (
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
                  <th className="p-2 font-medium w-32">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={`${item.link}-${i}`}
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
                    <td className="p-2">
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isDisabled={
                          !item.magnet &&
                          !(item.link && item.link.startsWith("magnet:"))
                        }
                        isLoading={addingIndex === i}
                        onPress={() => addToQbit(item, i)}
                      >
                        Add to qBittorrent
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
