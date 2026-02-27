import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { readShows } from "@/src/libs/trackers/storage";
import {
  findLibraryByName,
  getLastEpisode,
} from "@/src/libs/trackers/library";
import { LastEpisode } from "@/src/libs/trackers/library-utils";
export type CheckTrackerResponse = {
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
        { ok: false, error: "Tracker not found" },
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
      source: "trackers/check",
      message: "Error checking tracker:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to check tracker";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
