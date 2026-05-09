/**
 * HMAC-signed session cookie — Edge-safe (middleware) and Node-safe.
 * Cookie value: `<email>.<hex-hmac>`
 */

export const SESSION_COOKIE_NAME = "socialella_session";

export function getSessionSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.SESSION_SECRET ??
    "socialella-dev-secret-change-me"
  );
}

function bufferToHex(buf: Uint8Array): string {
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bufferToHex(new Uint8Array(sig));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export async function signSessionToken(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const sig = await hmacSha256Hex(normalized, getSessionSecret());
  return `${normalized}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const email = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!email || !sig) return null;
  const expected = await hmacSha256Hex(email, getSessionSecret());
  return timingSafeEqualHex(sig, expected) ? email : null;
}
