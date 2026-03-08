import { NextResponse } from "next/server";
import { readShows, addShow } from "@/src/libs/trackers/storage";
import { getShowLibraries } from "@/src/libs/trackers/library";
import type { TrackedShow } from "@/src/types/TrackedShow";
import { validateFormData } from "@/src/libs/validation/tracker-validations";
import { withHandler } from "@/src/libs/api/handler";

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

export const GET = withHandler("trackers", async () => {
  const shows = await readShows();
  const libraries = getShowLibraries().map((lib) => ({
    name: lib.name ?? "",
    path: lib.path ?? "",
  }));
  return NextResponse.json({ ok: true, shows, libraries });
});

export const POST = withHandler("trackers", async (request: Request) => {
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
});
