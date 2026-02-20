export function formatDataSize(
  bytes?: number | string | null,
  options: { sizeRef?: number } = {},
) {
  if (!bytes) return "-";

  let value = 0;
  if (typeof bytes === "string") {
    value = parseInt(bytes, 10);
    if (isNaN(value)) return "-";
  } else {
    value = bytes;
  }

  return formatBytes(value);
}

export function formatBytes(
  bytes: number,
  options: { sizeRef?: number } = {},
): string {
  const sizeRef = options.sizeRef ?? bytes;
  if (sizeRef < 1024) return `${bytes}B`;
  if (sizeRef < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (sizeRef < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  if (sizeRef < 1024 * 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)}TB`;
}
