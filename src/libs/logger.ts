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
  console[level](`[${source}] ${message}`, data);
}
