import { readFolders } from "@/src/libs/files/readFolders";
import { readConfig } from "@/src/libs/readConfig";
import { NextResponse } from "next/server";
import { withHandler } from "@/src/libs/api/handler";

export const GET = withHandler("files", async () => {
  const { downloadPaths, videosExt, libraries } = readConfig();
  const files = readFolders(downloadPaths, videosExt, libraries);
  return NextResponse.json({ ok: true, files });
});
