import { searchJackett } from "@/src/libs/torrents/jackett";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? searchParams.get("q") ?? "";

    const query = name.trim();
    if (!query) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const items = await searchJackett(query);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[torrents/feed] error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to search torrents";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
