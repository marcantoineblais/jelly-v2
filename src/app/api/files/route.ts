import { readFolders } from "@/src/libs/files/readFolders";
import { readConfig } from "@/src/libs/readConfig";
import { log } from "@/src/libs/logger";
import { NextResponse } from "next/server";

export function GET() {
  try {
    const { downloadPaths, videosExt, libraries } = readConfig();
    const files = readFolders(downloadPaths, videosExt, libraries);
    return NextResponse.json({ ok: true, files });
  } catch (err) {
    log({ source: "files", message: "Failed to read files", data: err, level: "error" });
    const message = err instanceof Error ? err.message : "Failed to read files";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
