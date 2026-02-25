import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { updateShow, removeShow } from "@/src/libs/shows/storage";
import type { TrackedShow } from "@/src/types/TrackedShow";

export type UpdateShowResponse = {
  ok: boolean;
  show?: TrackedShow;
  error?: string;
};

export type DeleteShowResponse = {
  ok: boolean;
  error?: string;
};

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, library, searchQuery, indexer, category } = body;

    const updates: Partial<Omit<TrackedShow, "id">> = {};
    if (typeof title === "string") updates.title = title.trim();
    if (typeof library === "string") updates.library = library.trim();
    if (typeof searchQuery === "string")
      updates.searchQuery = searchQuery.trim() || undefined;
    if (typeof indexer === "string")
      updates.indexer = indexer.trim() || undefined;
    if (typeof category === "string")
      updates.category = category.trim() || undefined;

    const show = await updateShow(id, updates);
    if (!show) {
      return NextResponse.json(
        { ok: false, error: "Show not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, show });
  } catch (err) {
    log({ source: "shows", message: "Error updating show:", data: err, level: "error" });
    const message = err instanceof Error ? err.message : "Failed to update show";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const removed = await removeShow(id);
    if (!removed) {
      return NextResponse.json(
        { ok: false, error: "Show not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log({ source: "shows", message: "Error deleting show:", data: err, level: "error" });
    const message = err instanceof Error ? err.message : "Failed to delete show";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
