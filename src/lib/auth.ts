import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
} from "@/lib/session-token";

/**
 * Solo-user credentials. Configurable via env, with sensible local defaults
 * matching what the app's UI promises on the login page.
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@admin.com";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "password123";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** True if the email/password match the admin credentials. */
export function checkCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  );
}

/** Server helper: read the session cookie and return the email or null. */
export async function getCurrentUserEmail(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

/** Server action helper: write the session cookie. */
export async function setSessionCookie(email: string): Promise<void> {
  const store = await cookies();
  const value = await signSessionToken(email);
  store.set(SESSION_COOKIE_NAME, value, {
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
  store.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
