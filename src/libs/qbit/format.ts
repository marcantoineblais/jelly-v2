import { formatDataSize } from "../format-data-size";

/**
 * Display formatting for qBittorrent torrent data.
 */
export function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) return "-";
  const size = formatDataSize(bytesPerSec);
  if (size === "-") return "0B/s";
  return `${size}/s`;
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
  return label !== undefined ? label : state || "-";
}

/** Collapse qBittorrent raw state into a UI-level status bucket. */
export function getStatusCategory(state: string): string {
  const s = (state || "").trim();
  switch (s) {
    case "downloading":
    case "forcedDL":
    case "allocating":
    case "moving":
      return "downloading";
    case "metaDL":
    case "stalledDL":
      return "stalled";
    case "stalledUP":
    case "pausedUP":
      return "completed";
    case "uploading":
    case "forcedUP":
      return "seeding";
    case "pausedDL":
      return "paused";
    case "error":
    case "missingFiles":
      return "error";
    default:
      return "other";
  }
}

/** ETA in seconds; 8640000 or negative = unknown in qBittorrent. */
export function formatEta(seconds: number): string {
  if (seconds <= 0 || !Number.isFinite(seconds) || seconds >= 8640000)
    return "-";
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min}min`;

  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m < 10 ? `0${m}` : m}`;
}
