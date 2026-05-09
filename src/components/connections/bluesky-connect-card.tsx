"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  connectBluesky,
  disconnectBluesky,
} from "@/actions/connections";
import { Icon } from "@/components/Icon";

type Props = {
  initial: { identifier: string; lastUsedAt: Date | null } | null;
};

export function BlueskyConnectCard({ initial }: Props) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [connected, setConnected] = useState(Boolean(initial));

  function handleConnect() {
    startTransition(async () => {
      const res = await connectBluesky({ identifier, password });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Connected as @${res.identifier}.`);
      setConnected(true);
      setPassword("");
      router.refresh();
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectBluesky();
      toast.success("Bluesky disconnected.");
      setConnected(false);
      setIdentifier("");
      router.refresh();
    });
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--gray-150)] p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e0f2fe] text-[#0284c7]">
            <Icon name="Sparkle" weight="fill" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--gray-900)]">
              Bluesky · direct publish
            </h2>
            <p className="mt-0.5 text-sm text-[var(--gray-600)]">
              Connect a Bluesky app password to publish drafts directly from
              the queue.{" "}
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--violet-600)] hover:underline"
              >
                Create one →
              </a>
            </p>
          </div>
        </div>
        {connected && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Connected
          </span>
        )}
      </header>

      <div className="space-y-3 p-5">
        {connected ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--gray-900)]">
                @{identifier || initial?.identifier}
              </p>
              <p className="mt-0.5 text-xs text-[var(--gray-500)]">
                {initial?.lastUsedAt
                  ? `Last used ${new Date(initial.lastUsedAt).toLocaleDateString()}`
                  : "Not used yet — direct publish ships in Stage 3."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="block">
                <span className="text-xs font-medium text-[var(--gray-700)]">
                  Handle
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.trim())}
                  placeholder="alice.bsky.social"
                  autoComplete="off"
                  className="mt-1 h-9 w-full rounded-[var(--radius-md)] border border-[var(--gray-200)] px-3 text-sm focus:border-[var(--violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--violet-100)]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-[var(--gray-700)]">
                  App password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  autoComplete="new-password"
                  className="mt-1 h-9 w-full rounded-[var(--radius-md)] border border-[var(--gray-200)] px-3 text-sm focus:border-[var(--violet-400)] focus:outline-none focus:ring-2 focus:ring-[var(--violet-100)]"
                />
              </label>
            </div>
            <p className="text-[11px] text-[var(--gray-500)]">
              Stored locally in your Postgres. Never share your main account
              password — always use a dedicated app password.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={pending || !identifier || !password}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--violet-700)] disabled:opacity-50"
            >
              {pending ? "Verifying…" : "Connect Bluesky"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
