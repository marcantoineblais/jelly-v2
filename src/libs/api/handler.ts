import { NextResponse } from "next/server";
import { log } from "@/src/libs/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => Promise<NextResponse>;

/**
 * Wraps a Next.js route handler with consistent error handling and logging.
 * Handles any uncaught error by logging it and returning a JSON error response.
 */
export function withHandler<T extends AnyHandler>(
  source: string,
  fn: T,
  options: { status?: number } = {},
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (err) {
      log({ source, message: "Request failed", data: err, level: "error" });
      const message = err instanceof Error ? err.message : "Request failed";
      return NextResponse.json(
        { ok: false, error: message },
        { status: options.status ?? 500 },
      );
    }
  }) as T;
}
