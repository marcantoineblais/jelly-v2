import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAndCreateSession } from "@/src/libs/auth/login";
import { IS_PROD, JWT_COOKIE_NAME } from "@/src/config";
import { validateLoginFormData } from "@/src/libs/validation/auth-validations";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const payload =
    body && typeof body === "object"
      ? (body as { username?: unknown; password?: unknown })
      : {};
  const username =
    typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const errors = validateLoginFormData({ username, password });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, error: "Username and password are required", errors },
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
