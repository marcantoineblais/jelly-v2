import type { SessionData } from "@/src/libs/session/storage";

type FetchFn = (
  url: string,
  options: { method?: string; headers?: HeadersInit; body?: BodyInit },
) => Promise<unknown>;

export async function persistSession(
  session: SessionData,
  fetchFn: FetchFn,
): Promise<void> {
  try {
    await fetchFn("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    });
  } catch {
    // ignore
  }
}
