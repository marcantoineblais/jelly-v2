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
  let dataString = "";
  if (data) {
    dataString = JSON.stringify(data);
  }
  console[level](`[${source}] ${message}`, dataString);
}
