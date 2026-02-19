export const runtime = "nodejs";

import { FILE_SERVER_URL } from "@/src/config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const files = await request.json();

  try {
    if (!FILE_SERVER_URL) {
      console.error("FILE_SERVER_URL is not set");
      return NextResponse.json(
        { ok: false, error: "File server URL not configured" },
        { status: 500 },
      );
    }
    
    const fileServerPath = `${FILE_SERVER_URL}/process-files`;
    const res = await fetch(fileServerPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });

    if (!res.ok) {
      let message = "Failed to submit job";
      try {
        const data = await res.json();
        if (data && typeof data === "object" && "error" in data) {
          message =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (data as any).error || message;
        }
      } catch {
        // ignore JSON parse errors and fall back to default message
      }

      if (res.status === 409) {
        // File server is busy with an active transfer
        return NextResponse.json(
          {
            ok: false,
            error:
              message ||
              "File server is busy. Please wait for the current transfer to finish.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        { status: res.status || 500 },
      );
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
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
