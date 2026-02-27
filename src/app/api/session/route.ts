export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAME } from "@/src/config";
import { getCurrentUser } from "@/src/libs/auth/login";
import {
  readSession,
  writeSession,
} from "@/src/libs/session/storage";
import { SessionData } from "@/src/providers/session-provider";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const username = await getCurrentUser(token);

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const session = await readSession(username);
  return NextResponse.json({ ok: true, session: session ?? {} });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME)?.value;
  const username = await getCurrentUser(token);

  if (!username) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: SessionData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  try {
    await writeSession(username, body);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
