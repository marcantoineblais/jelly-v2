"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import {
  formatEta,
  formatSize,
  formatSpeed,
  formatState,
} from "@/src/libs/qbit/format";
import useFetch from "@/src/hooks/use-fetch";
import { QbittorrentResponse } from "../api/qbit/torrents/route";
import LoadIndicator from "@/src/components/ui/load-indicator";

type QbitTorrent = {
  hash: string;
  name: string;
  state: string;
  progress: number;
  size: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
};

const POLL_INTERVAL_MS = 3000;

export default function DownloadsPage() {
  const { fetchData } = useFetch();
  const [torrents, setTorrents] = useState<QbitTorrent[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [deletingHash, setDeletingHash] = useState<string | null>(null);

  const deleteTorrent = useCallback(async (hash: string) => {
    setDeletingHash(hash);
    try {
      const res = await fetch(`/api/qbit/torrents/${encodeURIComponent(hash)}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setTorrents((prev) => prev.filter((t) => t.hash !== hash));
    } finally {
      setDeletingHash(null);
    }
  }, []);

  const fetchTorrents = useCallback(async () => {
    try {
      const { data } =
        await fetchData<QbittorrentResponse>("/api/qbit/torrents");
      setTorrents(data.torrents);
    } catch {
      setTorrents([]);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTorrents();
    const id = setInterval(fetchTorrents, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchTorrents]);

  return (
    <main className="min-h-full w-full flex flex-col gap-4 bg-stone-100 p-4 pb-8">
      {isPageLoading && <LoadIndicator />}

      <Table className="w-full text-left text-sm" aria-label="Downloads">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Progress</TableColumn>
          <TableColumn>Size</TableColumn>
          <TableColumn>Down</TableColumn>
          <TableColumn>Up</TableColumn>
          <TableColumn>ETA</TableColumn>
          <TableColumn align="end">Delete</TableColumn>
        </TableHeader>
        <TableBody items={torrents} emptyContent="No torrents in qBittorrent.">
          {(t) => (
            <TableRow key={t.hash}>
              <TableCell className="min-w-[200px]">{t.name || "—"}</TableCell>
              <TableCell>{formatState(t.state)}</TableCell>
              <TableCell>{(t.progress * 100).toFixed(1)}%</TableCell>
              <TableCell className="whitespace-nowrap">{formatSize(t.size)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatSpeed(t.dlspeed)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatSpeed(t.upspeed)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatEta(t.eta)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  isDisabled={deletingHash !== null}
                  isLoading={deletingHash === t.hash}
                  onPress={() => deleteTorrent(t.hash)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </main>
  );
}
