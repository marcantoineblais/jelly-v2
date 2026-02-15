export function formatBytes(bytes: number, options: { sizeRef?: number} = {}): string {
  const sizeRef = options.sizeRef ?? bytes;
  if (sizeRef < 1024) return `${bytes}B`;
  if (sizeRef < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (sizeRef < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}
