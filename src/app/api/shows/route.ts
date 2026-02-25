import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { readShows, addShow } from "@/src/libs/shows/storage";
import { getShowLibraries } from "@/src/libs/shows/library";
import type { TrackedShow } from "@/src/types/TrackedShow";
import { validateFormData } from "@/src/libs/validations";

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
    const title = body.title?.trim();
    const season = body.season;
    const minEpisode = body.minEpisode;
    const library = body.library?.trim();
    const searchQuery = body.searchQuery?.trim();
    const indexer = body.indexer?.trim();
    const category = body.category?.trim();

    const payload = {
      title,
      season,
      minEpisode,
      library,
      searchQuery,
      indexer,
      category,
    };

    const errors = validateFormData(payload, { src: "show" });
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const show = await addShow(payload);
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
