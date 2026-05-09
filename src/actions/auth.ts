"use server";

import { redirect } from "next/navigation";
import {
  checkCredentials,
  clearSessionCookie,
  setSessionCookie,
} from "@/lib/auth";

export async function signInAction(input: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<{ error?: string }> {
  const email = (input.email ?? "").trim();
  const password = input.password ?? "";
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (!checkCredentials(email, password)) {
    return { error: "Wrong email or password. Try admin@admin.com / password123." };
  }
  await setSessionCookie(email);
  redirect(safeRedirect(input.redirectTo) ?? "/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

/** Only allow same-origin paths. Defends against open redirects. */
function safeRedirect(target: string | undefined): string | null {
  if (!target) return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}
