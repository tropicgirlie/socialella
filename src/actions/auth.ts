"use server";

import { redirect } from "next/navigation";
import {
  checkCredentials,
  clearSessionCookie,
  setSessionCookie,
} from "@/lib/auth";

export type SignInState = { error?: string };

/**
 * Accepts FormData so it can be used directly as a `<form action>` —
 * works with or without client-side JS hydrated.
 */
export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (!checkCredentials(email, password)) {
    return {
      error: "Wrong email or password. Try admin@admin.com / password123.",
    };
  }
  await setSessionCookie(email);
  redirect(safeRedirect(next) ?? "/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

/** Only allow same-origin paths. Defends against open redirects. */
function safeRedirect(target: string | undefined | null): string | null {
  if (!target) return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}
