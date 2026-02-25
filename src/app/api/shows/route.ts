import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { readShows, addShow } from "@/src/libs/shows/storage";
import { getShowLibraries } from "@/src/libs/shows/library";
import type { TrackedShow } from "@/src/types/TrackedShow";

export type ShowsResponse = {
  ok: boolean;
  shows: TrackedShow[];
  libraries: { name: string; path: string }[];
  error?: string;
};

export type AddShowResponse = {
  ok: boolean;
  show?: TrackedShow;
  error?: string;
};

export async function GET() {
  try {
    const shows = await readShows();
    const libraries = getShowLibraries().map((lib) => ({
      name: lib.name ?? "",
      path: lib.path ?? "",
    }));
    return NextResponse.json({ ok: true, shows, libraries });
  } catch (err) {
    log({
      source: "shows",
      message: "Error listing shows:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to list shows";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, library, season, searchQuery, indexer, category } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
        { status: 400 },
      );
    }
    if (!library || typeof library !== "string") {
      return NextResponse.json(
        { ok: false, error: "Library is required" },
        { status: 400 },
      );
    }
    const parsedSeason = Number(season);
    if (!Number.isInteger(parsedSeason) || parsedSeason < 1) {
      return NextResponse.json(
        { ok: false, error: "Season must be a positive integer" },
        { status: 400 },
      );
    }

    const show = await addShow({
      title: title.trim(),
      season: parsedSeason,
      library: library.trim(),
      searchQuery: searchQuery?.trim() || undefined,
      indexer: indexer?.trim() || undefined,
      category: category?.trim() || undefined,
    });

    return NextResponse.json({ ok: true, show }, { status: 201 });
  } catch (err) {
    log({
      source: "shows",
      message: "Error adding show:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to add show";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
