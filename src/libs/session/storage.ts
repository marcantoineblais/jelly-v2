import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { SESSION_DATA_PATH } from "@/src/config";
import { SessionData } from "@/src/providers/session-provider";

export type DownloadFilters = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};

function sessionFilePath(username: string): string {
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${SESSION_DATA_PATH}/${safe}.json`;
}

export async function readSession(
  username: string,
): Promise<SessionData | null> {
  try {
    const raw = await readFile(sessionFilePath(username), "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (data && typeof data === "object") {
      return data as SessionData;
    }
  } catch {
    // File missing or invalid
  }
  return null;
}

export async function writeSession(
  username: string,
  data: SessionData,
): Promise<void> {
  await mkdir(dirname(sessionFilePath(username)), { recursive: true });
  await writeFile(
    sessionFilePath(username),
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}
