import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";
import { findLibraryByName, listShowFolders } from "@/src/libs/shows/library";

export type LibraryFoldersResponse = {
  ok: boolean;
  folders: string[];
  error?: string;
};

type RouteParams = { params: Promise<{ name: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { name } = await params;
    const decoded = decodeURIComponent(name);
    const library = findLibraryByName(decoded);
    if (!library?.path) {
      return NextResponse.json(
        { ok: false, error: `Library "${decoded}" not found`, folders: [] },
        { status: 404 },
      );
    }

    const folders = await listShowFolders(library.path);
    return NextResponse.json({ ok: true, folders });
  } catch (err) {
    log({
      source: "shows/libraries/folders",
      message: "Error listing folders:",
      data: err,
      level: "error",
    });
    const message = err instanceof Error ? err.message : "Failed to list folders";
    return NextResponse.json(
      { ok: false, error: message, folders: [] },
      { status: 500 },
    );
  }
}
