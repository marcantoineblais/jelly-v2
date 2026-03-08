import { NextResponse } from "next/server";
import { updateShow, removeShow } from "@/src/libs/trackers/storage";
import type { TrackedShow } from "@/src/types/TrackedShow";
import { validateFormData } from "@/src/libs/validation/tracker-validations";
import { withHandler } from "@/src/libs/api/handler";

export type UpdateTrackerResponse = {
  ok: boolean;
  show?: TrackedShow;
  errors?: Record<string, string>;
  error?: string;
};

export type DeleteTrackerResponse = {
  ok: boolean;
  error?: string;
};

type RouteParams = { params: Promise<{ id: string }> };

export const PUT = withHandler(
  "trackers",
  async (request: Request, { params }: RouteParams) => {
    const { id } = await params;
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

    const show = await updateShow(id, payload);
    if (!show) {
      return NextResponse.json(
        { ok: false, error: "Tracker not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, show });
  },
);

export const DELETE = withHandler(
  "trackers",
  async (_request: Request, { params }: RouteParams) => {
    const { id } = await params;
    const removed = await removeShow(id);
    if (!removed) {
      return NextResponse.json(
        { ok: false, error: "Tracker not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  },
);
