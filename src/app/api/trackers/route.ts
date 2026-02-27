import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { readShows, addShow } from "@/src/libs/trackers/storage";
import { getShowLibraries } from "@/src/libs/trackers/library";
import type { TrackedShow } from "@/src/types/TrackedShow";
import { validateFormData } from "@/src/libs/validation/tracker-validations";

export type TrackersResponse = {
  ok: boolean;
  shows: TrackedShow[];
  libraries: { name: string; path: string }[];
  error?: string;
};

export type AddTrackerResponse = {
  ok: boolean;
  show?: TrackedShow;
  errors?: Record<string, string>;
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
      source: "trackers",
      message: "Error listing trackers:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to list trackers";
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
    const additionalQuery = body.additionalQuery?.trim();
    const indexer = body.indexer?.trim();
    const category = body.category?.trim();

    const payload = {
      title,
      season,
      minEpisode,
      library,
      additionalQuery,
      indexer,
      category,
    };

    const errors = validateFormData(payload);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const show = await addShow(payload);
    return NextResponse.json({ ok: true, show }, { status: 201 });
  } catch (err) {
    log({
      source: "trackers",
      message: "Error adding tracker:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to add tracker";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
