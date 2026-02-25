import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createCredentials,
  verifyAndCreateSession,
} from "@/src/libs/auth/login";
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

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await createCredentials(username, password);

  if (!result.ok) {
    const status = result.error === "Credentials already exist" ? 409 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  // Auto-login after setup
  const sessionResult = await verifyAndCreateSession(username, password);
  if (sessionResult.ok) {
    const cookieStore = await cookies();
    cookieStore.set(JWT_COOKIE_NAME, sessionResult.token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
  }

  return NextResponse.json({ ok: true });
}
