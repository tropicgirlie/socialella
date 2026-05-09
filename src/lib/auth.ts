import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Solo-user credentials. Configurable via env, with sensible local defaults
 * matching what the app's UI promises on the login page.
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@admin.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "password123";

const COOKIE_NAME = "socialella_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Cookie value is `<email>.<sig>` where sig = HMAC(secret, email).
 * Plenty for a single-user app — when we move to multi-tenant we'll swap
 * this out for Auth.js. Until then, no extra deps.
 */
function getSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.SESSION_SECRET ??
    // Stable dev fallback so local cookies survive restarts.
    "socialella-dev-secret-change-me"
  );
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** True if the email/password match the admin credentials. */
export function checkCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
}

/** Build the cookie value for a given email. */
export function makeSessionToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  return `${normalized}.${sign(normalized)}`;
}

/** Validate a raw cookie value and return the email it encodes, or null. */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const email = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!email || !sig) return null;
  return safeEqual(sig, sign(email)) ? email : null;
}

/** Server helper: read the session cookie and return the email or null. */
export async function getCurrentUserEmail(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

/** Server action helper: write the session cookie. */
export async function setSessionCookie(email: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Server action helper: clear the session cookie. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
