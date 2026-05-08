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
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-16 overflow-hidden">
      {/* Soft sun-burst gradient behind the card — keeps the editorial warmth on auth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, var(--accent-peach) 0%, transparent 60%), radial-gradient(circle at 80% 100%, var(--accent-rose-soft) 0%, transparent 50%)",
        }}
      />

      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p
            className="editorial-mark text-6xl text-[var(--color-accent)] leading-none"
            aria-hidden
          >
            S
          </p>
          <h1
            className="font-display mt-2 text-5xl tracking-tight text-[var(--color-text)]"
            style={{ fontVariationSettings: '"SOFT" 80, "opsz" 144' }}
          >
            ocialella
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            A calm space to plan, schedule, and ship — for solo founders.
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 shadow-[var(--shadow-md)]">
          <h2 className="font-display text-2xl">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Sign in with your password to manage queues and drafts.
          </p>

          <form
            className="mt-6 space-y-5"
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
            <div className="space-y-2">
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
                placeholder="Your solo password"
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
              {pending ? "Signing in…" : "Continue"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          Built for one founder, one keyboard, one rhythm.
        </p>
      </div>
    </div>
  );
}
