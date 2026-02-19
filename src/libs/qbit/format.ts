/**
 * Display formatting for qBittorrent torrent data.
 */

export function formatSize(bytes: number): string {
  if (bytes <= 0 || !Number.isFinite(bytes)) return "-";
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec <= 0 || !Number.isFinite(bytesPerSec)) return "-";
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

/** Map qBittorrent raw state to a short display label. */
export function formatState(state: string): string {
  const s = (state || "").trim();
  const map: Record<string, string> = {
    downloading: "Downloading",
    stalledDL: "Stalled",
    uploading: "Seeding",
    stalledUP: "Completed",
    forcedUP: "Seeding",
    forcedDL: "Downloading",
    metaDL: "Metadata",
    pausedDL: "Paused",
    pausedUP: "Paused",
    checkingDL: "Checking",
    checkingUP: "Checking",
    queuedDL: "Queued",
    queuedUP: "Queued",
    allocating: "Allocating",
    moving: "Moving",
    error: "Error",
    missingFiles: "Missing files",
    unknown: "-",
  };
  const label = map[s];
  return label !== undefined ? label : (state || "-");
}

/** ETA in seconds; 8640000 or negative = unknown in qBittorrent. */
export function formatEta(seconds: number): string {
  if (seconds <= 0 || !Number.isFinite(seconds) || seconds >= 8640000) return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min}min`;

  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m < 10 ? `0${m}` : m}`;
}
