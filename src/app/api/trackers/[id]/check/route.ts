import { NextResponse } from "next/server";
import { readShowById } from "@/src/libs/trackers/storage";
import { findLibraryByName, getLastEpisode } from "@/src/libs/trackers/library";
import { LastEpisode } from "@/src/libs/trackers/library-utils";
import { withHandler } from "@/src/libs/api/handler";

export type CheckTrackerResponse = {
  ok: boolean;
  lastEpisode?: LastEpisode;
  error?: string;
};

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withHandler(
  "trackers/check",
  async (_request: Request, { params }: RouteParams) => {
    const { id } = await params;
    const show = await readShowById(id);
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
  },
);
