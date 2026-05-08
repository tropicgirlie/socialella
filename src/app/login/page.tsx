"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--color-bg-muted)] px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--indigo-600)] text-white">
            <span className="text-base font-bold">S</span>
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Socialella
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sign in to your scheduler.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)]">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                const res = await signIn("credentials", {
                  password,
                  redirect: false,
                  callbackUrl: "/",
                });
                if (!res?.ok) {
                  setError("Incorrect password.");
                  return;
                }
                window.location.href = "/";
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            {error && (
              <p
                className="text-sm text-[var(--color-danger)]"
                role="alert"
                aria-live="polite"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
