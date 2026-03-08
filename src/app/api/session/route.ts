export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAME } from "@/src/config";
import { getCurrentUser } from "@/src/libs/auth/login";
import { readSession, writeSession } from "@/src/libs/session/storage";
import { SessionData } from "@/src/providers/session-provider";
import { withHandler } from "@/src/libs/api/handler";

export const GET = withHandler("session", async () => {
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
});

export const POST = withHandler("session", async (request: NextRequest) => {
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

  await writeSession(username, body);
  return NextResponse.json({ ok: true });
});
