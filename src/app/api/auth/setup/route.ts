import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createCredentials,
  verifyAndCreateSession,
} from "@/src/libs/auth/login";
import { IS_PROD, JWT_COOKIE_NAME } from "@/src/config";
import { validateLoginFormData } from "@/src/libs/validation/auth-validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { username: rawUsername, password: rawPassword } = body as {
      username?: unknown;
      password?: unknown;
    };
    const username = typeof rawUsername === "string" ? rawUsername.trim() : "";
    const password = typeof rawPassword === "string" ? rawPassword : "";
    const errors = validateLoginFormData({ username, password });

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { ok: false, error: "Username and password are required", errors },
        { status: 400 },
      );
    }

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
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create account";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
