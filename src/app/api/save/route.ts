export const runtime = "nodejs";

import { FILE_SERVER_URL } from "@/src/config";
import { NextRequest, NextResponse } from "next/server";
import { withHandler } from "@/src/libs/api/handler";

export const POST = withHandler("save", async (request: NextRequest) => {
  const files = await request.json();

  if (!FILE_SERVER_URL) {
    return NextResponse.json(
      { ok: false, error: "File server URL not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(`${FILE_SERVER_URL}/process-files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });

  if (!res.ok) {
    let message = "Failed to submit job";
    try {
      const data = await res.json();
      if (data && typeof data === "object" && "error" in data) {
        message = (data as { error?: string }).error || message;
      }
    } catch {
      // ignore JSON parse errors and fall back to default message
    }
    return NextResponse.json(
      { ok: false, error: message },
      { status: res.status || 500 },
    );
  }

  return NextResponse.json({ ok: true });
});
