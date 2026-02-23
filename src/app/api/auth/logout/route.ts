import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { IS_PROD, JWT_COOKIE_NAME } from "@/src/config";

export async function POST() {
  const cookieStore = await cookies();
  // Must match the options used when setting the cookie (login) for the browser to clear it
  cookieStore.set(JWT_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
  });
  return NextResponse.json({ ok: true });
}
