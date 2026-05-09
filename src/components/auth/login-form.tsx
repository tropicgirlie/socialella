"use client";

import { useState, useTransition } from "react";
import { signInAction } from "@/actions/auth";
import { Icon } from "@/components/Icon";

type Props = {
  next?: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: Props) {
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signInAction({ email, password, redirectTo: next });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-xs font-semibold text-[var(--gray-700)]">
          Email
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--violet-100)]"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-xs font-semibold text-[var(--gray-700)]">
          Password
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-[10px] font-medium text-[var(--violet-600)] hover:underline"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--violet-100)]"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-[var(--radius-md)] border border-[var(--pink-200)] bg-[var(--pink-50)] px-3 py-2 text-xs text-[var(--pink-700)]"
        >
          <Icon name="Bell" weight="fill" className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)] transition-colors hover:bg-[var(--violet-700)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
        {!pending && <Icon name="ArrowRight" weight="bold" className="h-4 w-4" />}
      </button>
    </form>
  );
}
