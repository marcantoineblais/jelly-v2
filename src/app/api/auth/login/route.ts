import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAndCreateSession } from "@/src/libs/auth/login";
import { IS_PROD, JWT_COOKIE_NAME } from "@/src/config";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const username =
    typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json(
      { ok: false, error: "Username and password are required" },
      { status: 400 },
    );
  }

  const result = await verifyAndCreateSession(username, password);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 401 },
    );
  }

  const cookieStore = await cookies();
  const cookieName = JWT_COOKIE_NAME;

  cookieStore.set(cookieName, result.token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
