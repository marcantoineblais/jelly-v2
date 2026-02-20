import { log } from "./logger";

export function formatDataSize(bytes?: number | string | null): string {
  if (!bytes) return "-";

  let value = 0;
  if (typeof bytes === "string") {
    value = parseInt(bytes, 10);
    if (isNaN(value)) return "-";
  } else {
    value = bytes;
  }
  log({
    source: "formatDataSize",
    message: "Value: ",
    data: value,
  })

  if (value <= 0 || !Number.isFinite(value)) return "-";
  const gb = value / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)}GB`;
  const mb = value / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)}MB`;
  const kb = value / 1024;
  if (kb >= 1) return `${kb.toFixed(1)}KB`;
  return `${value}B`;
}