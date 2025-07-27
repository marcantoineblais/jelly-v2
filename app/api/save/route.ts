export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const files = await request.json();
  const url = process.env.NEXT_PUBLIC_FILE_SERVER_URL;

  try {
    // Send job to file-server.js via HTTP POST
    const res = await fetch(url + "/process-files", {
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
