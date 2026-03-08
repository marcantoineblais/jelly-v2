import {
  getJackettIndexers,
  JackettIndexer,
} from "@/src/libs/downloads/jackett";
import { NextResponse } from "next/server";
import { withHandler } from "@/src/libs/api/handler";

export type JackettIndexerResponse = {
  ok: boolean;
  indexers: JackettIndexer[];
  error?: string;
};

export const GET = withHandler(
  "downloads/indexers",
  async () => {
    const { indexers } = await getJackettIndexers();
    return NextResponse.json({ ok: true, indexers });
  },
  { status: 502 },
);
