import { NextRequest, NextResponse } from "next/server";
import { log } from "@/src/libs/logger";

type RouteContext<
  P extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> = {
  params: Promise<P>;
};

type AnyHandler<
  P extends Record<string, string | string[]> = Record<
    string,
    string | string[]
  >,
> = (req: NextRequest, ctx: RouteContext<P>) => Promise<NextResponse>;

/**
 * Wraps a Next.js route handler with consistent error handling and logging.
 * Handles any uncaught error by logging it and returning a JSON error response.
 */
export function withHandler<P extends Record<string, string | string[]>>(
  source: string,
  fn: AnyHandler<P>,
  options: { status?: number } = {},
): AnyHandler<P> {
  return async (req: NextRequest, ctx: RouteContext<P>) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      log({ source, message: "Request failed", data: err, level: "error" });
      const message = err instanceof Error ? err.message : "Request failed";
      return NextResponse.json(
        { ok: false, error: message },
        { status: options.status ?? 500 },
      );
    }
  };
}
