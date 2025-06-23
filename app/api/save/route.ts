import { createFilename } from "@/app/libs/files/createFilename";
import { formatNumber } from "@/app/libs/files/formatNumber";
import { MediaFile } from "@/app/types/MediaFile";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  const files: MediaFile[] = await request.json();
  const errors: {file: MediaFile, message: string }[] = [];

  files.map((file) => {
    const filename = createFilename(file.mediaInfo);
    const basepath = file.library.path;
    const type = file.library.type;
    const season = file.mediaInfo.season;
    const title = file.mediaInfo.title;

    if (filename && basepath && title) {
      const updatedPath = path.join(
        basepath,
        type === "show" ? title : "",
        type === "show" && season ? `Season ${formatNumber(season)}` : "",
        filename + file.ext
      );

      try {
        const destDir = path.dirname(updatedPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(file.path, updatedPath);
        fs.unlinkSync(file.path);
      } catch (error: any) {
        console.error("Error moving file:", error);
        errors.push({ file: file, message: error.message })
      }
    }
  });

  return NextResponse.json({ ok: true, errors: errors });
}
