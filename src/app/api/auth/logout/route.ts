import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { JWT_COOKIE_NAME } from "@/src/config";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
