import * as jose from "jose";
import bcrypt from "bcrypt";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import {
  JWT_COOKIE_NAME,
  JWT_SIGN_TOKEN,
  AUTH_DATA_PATH,
  SESSION_DURATION_MS,
} from "@/src/config";

type CredentialsFile = { username: string; passwordHash: string };

export type LoginResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export type CreateCredentialsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function credentialsExist(): Promise<boolean> {
  return (await readCredentials()) !== null;
}

async function readCredentials(): Promise<CredentialsFile | null> {
  try {
    const raw = await readFile(AUTH_DATA_PATH, "utf-8");
    const data = JSON.parse(raw) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "username" in data &&
      "passwordHash" in data &&
      typeof (data as CredentialsFile).username === "string" &&
      typeof (data as CredentialsFile).passwordHash === "string"
    ) {
      return data as CredentialsFile;
    }
  } catch {
    // File missing or invalid
  }
  return null;
}

export async function verifyAndCreateSession(
  username: string,
  password: string
): Promise<LoginResult> {
  const creds = await readCredentials();
  if (!creds) {
    return { ok: false, error: "Login is not configured" };
  }

  if (username !== creds.username) {
    return { ok: false, error: "Invalid username or password" };
  }

  const passwordMatch = await bcrypt.compare(password, creds.passwordHash);
  if (!passwordMatch) {
    return { ok: false, error: "Invalid username or password" };
  }

  if (!JWT_SIGN_TOKEN) {
    return { ok: false, error: "JWT sign token is not configured" };
  }

  const secret = new TextEncoder().encode(JWT_SIGN_TOKEN);
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_MS / 1000;

  const token = await new jose.SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(secret);

  return { ok: true, token };
}

export async function createCredentials(
  username: string,
  password: string
): Promise<CreateCredentialsResult> {
  const existing = await readCredentials();
  if (existing) {
    return { ok: false, error: "Credentials already exist" };
  }

  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 1) {
    return { ok: false, error: "Username is required" };
  }

  if (!password || password.length < 1) {
    return { ok: false, error: "Password is required" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const data: CredentialsFile = { username: trimmed, passwordHash };

  try {
    await mkdir(dirname(AUTH_DATA_PATH), { recursive: true });
    await writeFile(AUTH_DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to write credentials";
    return { ok: false, error: message };
  }

  return { ok: true };
}

export function getCookieName(): string {
  return JWT_COOKIE_NAME;
}

export async function verifySessionToken(
  token: string
): Promise<{ sub: string } | null> {
  if (!JWT_SIGN_TOKEN) return null;
  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SIGN_TOKEN)
    );
    const sub = payload.sub;
    return typeof sub === "string" ? { sub } : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(
  token: string | undefined
): Promise<string | null> {
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}
