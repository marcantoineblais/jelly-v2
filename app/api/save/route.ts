export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const files = await request.json();

  try {
    const fileServerUrl = process.env.FILE_SERVER_URL;
    if (!fileServerUrl) {
      console.error("FILE_SERVER_URL is not set");
      return NextResponse.json(
        { ok: false, error: "File server URL not configured" },
        { status: 500 }
      );
    }
    const res = await fetch(`${fileServerUrl.replace(/\/$/, "")}/process-files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ok: false,
        error: data.error || "Failed to submit job",
      });
    }
  } catch (error) {
    console.log("Encounted error while processing files:", error);
    let message = "Unknown error";
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    return NextResponse.json({ ok: false, error: message });
  }

  return NextResponse.json({ ok: true });
}
