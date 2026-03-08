import { NextResponse } from "next/server";
import {
  findLibraryByName,
  listShowFolders,
} from "@/src/libs/trackers/library";
import { withHandler } from "@/src/libs/api/handler";

export type LibraryFoldersResponse = {
  ok: boolean;
  folders: string[];
  error?: string;
};

type RouteParams = { params: Promise<{ name: string }> };

export const GET = withHandler(
  "trackers/libraries/folders",
  async (_request: Request, { params }: RouteParams) => {
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
  },
);
