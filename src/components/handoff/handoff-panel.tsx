"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  type PlatformId,
} from "@/lib/constants";
import {
  getHandoff,
  handoffIsOneClick,
  platformRequiresMedia,
} from "@/lib/platform-links";
import { prepareHandoff } from "@/actions/handoff";
import { markPosted } from "@/actions/posts";

type Props = {
  postId: string;
  /** Platforms to surface as primary chips. Defaults to the user's likely set. */
  primaryPlatforms?: readonly PlatformId[];
};

const DEFAULT_PRIMARY: readonly PlatformId[] = [
  "x",
  "linkedin",
  "instagram",
  "tiktok",
] as const;

/** A small color dot per platform (used as the visual identifier on neutral pills). */
const PLATFORM_DOT: Record<PlatformId, string> = {
  x: "#0f1419",
  linkedin: "#0a66c2",
  instagram: "#e1306c",
  tiktok: "#010101",
  threads: "#000000",
  bluesky: "#0085ff",
  mastodon: "#6364ff",
  facebook: "#1877f2",
  pinterest: "#bd081c",
};

async function downloadCrossOrigin(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function filenameFromUrl(url: string, fallbackIndex: number): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return last;
  } catch {
    // ignore
  }
  return `socialella-media-${fallbackIndex + 1}`;
}

export function HandoffPanel({
  postId,
  primaryPlatforms = DEFAULT_PRIMARY,
}: Props) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [busyPlatform, setBusyPlatform] = useState<PlatformId | null>(null);
  const [handedOffTo, setHandedOffTo] = useState<Set<PlatformId>>(
    () => new Set(),
  );
  const [pendingMark, startMarkTransition] = useTransition();

  const visiblePlatforms = showAll
    ? PLATFORMS
    : (primaryPlatforms as readonly PlatformId[]);

  async function handlePlatform(platform: PlatformId) {
    setBusyPlatform(platform);
    try {
      const res = await prepareHandoff(postId, platform);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { content, appUrl, media } = res.data;

      if (!content) {
        toast.error("This post has no content yet.");
        return;
      }

      try {
        await navigator.clipboard.writeText(content);
      } catch {
        // Clipboard blocked — fall through; URL fallback still helps.
      }

      if (platformRequiresMedia(platform)) {
        if (media.length === 0) {
          toast.warning(
            `${PLATFORM_LABELS[platform]} needs media. No media uploaded — caption is on your clipboard.`,
          );
        } else {
          for (const [i, m] of media.entries()) {
            await downloadCrossOrigin(m.url, filenameFromUrl(m.url, i));
          }
        }
      }

      const method = getHandoff(platform, content, appUrl ?? undefined);
      let openedUrl: string | null = null;
      if (
        method.kind === "intent" ||
        method.kind === "share" ||
        method.kind === "compose-paste"
      ) {
        openedUrl = method.url;
      } else if (method.kind === "manual" && method.desktopUrl) {
        openedUrl = method.desktopUrl;
      }
      if (openedUrl) {
        window.open(openedUrl, "_blank", "noopener,noreferrer");
      }

      setHandedOffTo((prev) => {
        const next = new Set(prev);
        next.add(platform);
        return next;
      });

      const oneClick = handoffIsOneClick(platform);
      toast.success(
        oneClick
          ? `${PLATFORM_LABELS[platform]} opened with your text. Review and post.`
          : `Caption copied. ${PLATFORM_LABELS[platform]} opened — paste with ⌘V.`,
      );
    } finally {
      setBusyPlatform(null);
    }
  }

  function handleMarkPosted() {
    startMarkTransition(async () => {
      await markPosted(postId);
      toast.success("Marked as posted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {visiblePlatforms.map((platform) => {
          const handed = handedOffTo.has(platform);
          const busy = busyPlatform === platform;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => handlePlatform(platform)}
              disabled={busy}
              aria-busy={busy}
              className={cn(
                "group inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--indigo-300)] hover:bg-[var(--indigo-50)] hover:text-[var(--indigo-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--indigo-500)] disabled:opacity-60",
                handed && "border-[var(--indigo-200)] bg-[var(--indigo-50)] text-[var(--indigo-700)]",
              )}
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: PLATFORM_DOT[platform] }}
              />
              <span>{PLATFORM_LABELS[platform]}</span>
              {handed && (
                <span aria-hidden className="text-[10px]">
                  ✓
                </span>
              )}
              {busy && (
                <span className="ml-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              )}
            </button>
          );
        })}
        {!showAll && primaryPlatforms.length < PLATFORMS.length && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="inline-flex h-8 items-center rounded-full border border-dashed border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)]"
          >
            + More platforms
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleMarkPosted}
          disabled={pendingMark}
          aria-busy={pendingMark}
        >
          Mark posted
        </Button>
        {handedOffTo.size > 0 && (
          <Badge variant="secondary" className="text-[11px]">
            Handed off to {handedOffTo.size}
            {handedOffTo.size === 1 ? " platform" : " platforms"}
          </Badge>
        )}
      </div>
    </div>
  );
}
