import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { TRACKERS_DATA_PATH } from "@/src/config";
import type { TrackedShow } from "@/src/types/TrackedShow";

export async function readShows(): Promise<TrackedShow[]> {
  try {
    const raw = await readFile(TRACKERS_DATA_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as TrackedShow[];
  } catch {
    // File missing or invalid
  }
  return [];
}

async function writeShows(shows: TrackedShow[]): Promise<void> {
  await mkdir(dirname(TRACKERS_DATA_PATH), { recursive: true });
  await writeFile(TRACKERS_DATA_PATH, JSON.stringify(shows, null, 2), "utf-8");
}

export async function addShow(
  show: Omit<TrackedShow, "id">,
): Promise<TrackedShow> {
  const shows = await readShows();
  const newShow: TrackedShow = { ...show, id: crypto.randomUUID() };
  shows.push(newShow);
  await writeShows(shows);
  return newShow;
}

export async function updateShow(
  id: string,
  updates: Partial<Omit<TrackedShow, "id">>,
): Promise<TrackedShow | null> {
  const shows = await readShows();
  const index = shows.findIndex((s) => s.id === id);
  if (index === -1) return null;
  shows[index] = { ...shows[index], ...updates };
  await writeShows(shows);
  return shows[index];
}

export async function removeShow(id: string): Promise<boolean> {
  const shows = await readShows();
  const filtered = shows.filter((s) => s.id !== id);
  if (filtered.length === shows.length) return false;
  await writeShows(filtered);
  return true;
}
