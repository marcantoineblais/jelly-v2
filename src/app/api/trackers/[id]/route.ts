import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { updateShow, removeShow } from "@/src/libs/trackers/storage";
import type { TrackedShow } from "@/src/types/TrackedShow";
import { validateFormData } from "@/src/libs/validation/tracker-validations";

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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
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
  } catch (err) {
    log({
      source: "trackers",
      message: "Error updating tracker:",
      data: err,
      level: "error",
    });
    const message =
      err instanceof Error ? err.message : "Failed to update tracker";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const removed = await removeShow(id);
    if (!removed) {
      return NextResponse.json(
        { ok: false, error: "Tracker not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log({
      source: "trackers",
      message: "Error deleting tracker:",
      data: err,
      level: "error",
    });
    const message =
      err instanceof Error ? err.message : "Failed to delete tracker";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
