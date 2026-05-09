"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type SignInState } from "@/actions/auth";
import { Icon } from "@/components/Icon";

type Props = {
  next?: string;
  initialError?: string;
};

const INITIAL: SignInState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)] transition-colors hover:bg-[var(--violet-700)] disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
      {!pending && <Icon name="ArrowRight" weight="bold" className="h-4 w-4" />}
    </button>
  );
}

export function LoginForm({ next, initialError }: Props) {
  const [state, formAction] = useActionState<SignInState, FormData>(
    signInAction,
    initialError ? { error: initialError } : INITIAL,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <label className="block">
        <span className="text-xs font-semibold text-[var(--gray-700)]">
          Email
        </span>
        <input
          name="email"
          type="email"
          defaultValue="admin@admin.com"
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
          name="password"
          type={showPassword ? "text" : "password"}
          defaultValue="password123"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:border-[var(--violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--violet-100)]"
        />
      </label>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-[var(--radius-md)] border border-[var(--pink-200)] bg-[var(--pink-50)] px-3 py-2 text-xs text-[var(--pink-700)]"
        >
          <Icon name="Bell" weight="fill" className="mt-0.5 h-3 w-3 shrink-0" />
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
