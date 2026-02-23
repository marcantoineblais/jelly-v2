import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { JWT_COOKIE_NAME } from "@/src/config";
import {
  verifySessionToken,
  credentialsExist,
} from "@/src/libs/auth/login";

const PUBLIC_PATHS = ["/login", "/setup"];
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/setup",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return true;
  if (
    PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  )
    return true;
  return false;
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /login and /setup based on whether credentials exist
  if (pathname === "/login" || pathname === "/setup") {
    const hasCredentials = await credentialsExist();
    if (pathname === "/login" && !hasCredentials) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    if (pathname === "/setup" && hasCredentials) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  if (!token) {
    const hasCredentials = await credentialsExist();
    const targetPath = hasCredentials ? "/login" : "/setup";
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const redirectUrl = new URL(targetPath, request.url);
    redirectUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    const hasCredentials = await credentialsExist();
    const targetPath = hasCredentials ? "/login" : "/setup";
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const redirectUrl = new URL(targetPath, request.url);
    redirectUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, manifest.webmanifest
     * - image files (*.ico, *.png, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
