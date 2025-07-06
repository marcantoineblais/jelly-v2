import { readFolders } from "@/app/libs/files/readFolders";
import { readConfig } from "@/app/libs/readConfig";
import { NextResponse } from "next/server";

export function POST() {
  const { downloadPaths, videosExt, libraries } = readConfig();
  const files = readFolders(downloadPaths, videosExt, libraries);

  return NextResponse.json({ ok: true, files });
}