import { IS_PROD } from "../config";

export function log({
  message,
  source,
  data,
  level = "info",
}: {
  source: string;
  message: string;
  data?: unknown;
  level?: "info" | "error" | "warn" | "debug";
}) {
  if (IS_PROD && level === "debug") return;
  console[level](`[${source}] ${message}`, data);
}
