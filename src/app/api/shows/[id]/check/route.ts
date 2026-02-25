import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { readShows } from "@/src/libs/shows/storage";
import {
  findLibraryByName,
  getLastEpisode,
  LastEpisode,
} from "@/src/libs/shows/library";
export type CheckShowResponse = {
  ok: boolean;
  lastEpisode?: LastEpisode;
  error?: string;
};

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const shows = await readShows();
    const show = shows.find((s) => s.id === id);
    if (!show) {
      return NextResponse.json(
        { ok: false, error: "Show not found" },
        { status: 404 },
      );
    }

    const library = findLibraryByName(show.library);
    if (!library?.path) {
      return NextResponse.json(
        { ok: false, error: `Library "${show.library}" not found` },
        { status: 404 },
      );
    }

    const lastEpisode = await getLastEpisode(
      show.title,
      library.path,
      show.season ?? 1,
    );
    return NextResponse.json({ ok: true, lastEpisode });
  } catch (err) {
    log({
      source: "shows/check",
      message: "Error checking show:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to check show";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
