"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  type PlatformId,
} from "@/lib/constants";
import type { TonePreset } from "@/lib/constants";
import { analyzeConfidence, stripIssue, type ConfidenceIssue } from "@/lib/confidence";
import { checklistLabels, defaultChecklist } from "@/lib/founder-checklist";
import { defaultToneForPlatform, applyTonePreset } from "@/lib/tone";
import { getComposerDeepLink } from "@/lib/platform-links";
import { savePost, schedulePost, ensureVariantsFromBase } from "@/actions/posts";
import { uploadPostMedia, deleteMedia } from "@/actions/media";
import { aiRewriteVariant } from "@/actions/ai";
import type { apps, campaigns, postMedia, posts, postVariants } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type AppRow = typeof apps.$inferSelect;
type CampaignRow = typeof campaigns.$inferSelect;
type PostRow = typeof posts.$inferSelect;
type VariantRow = typeof postVariants.$inferSelect;
type MediaRow = typeof postMedia.$inferSelect;

type VariantState = Record<
  PlatformId,
  { content: string; tone: TonePreset }
>;

function buildInitialVariants(
  base: string,
  existing?: VariantRow[],
): VariantState {
  const state = {} as VariantState;
  for (const p of PLATFORMS) {
    const tone = defaultToneForPlatform(p);
    const found = existing?.find((v) => v.platform === p);
    state[p] = {
      content: found?.content ?? applyTonePreset(base, p, tone),
      tone: (found?.tone as TonePreset) ?? tone,
    };
  }
  return state;
}

export function ComposeForm(props: {
  apps: AppRow[];
  campaignsByApp: Record<string, CampaignRow[]>;
  initial?: {
    post: PostRow;
    variants: VariantRow[];
    media: MediaRow[];
  } | null;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(
    props.initial?.post.id ?? null,
  );
  const [appId, setAppId] = useState(props.initial?.post.appId ?? "");
  const [campaignId, setCampaignId] = useState<string | null>(
    props.initial?.post.campaignId ?? null,
  );
  const [baseContent, setBaseContent] = useState(
    props.initial?.post.baseContent ?? "",
  );
  const [launchDay, setLaunchDay] = useState(
    props.initial?.post.launchDayMode ?? false,
  );
  const [evergreen, setEvergreen] = useState(
    props.initial?.post.isEvergreen ?? false,
  );
  const [energyTag, setEnergyTag] = useState<"" | "high" | "low">(
    (props.initial?.post.energyTag as "high" | "low" | null) ?? "",
  );
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => ({
    ...defaultChecklist(props.initial?.post.launchDayMode ?? false),
    ...(props.initial?.post.founderChecklistJson ?? {}),
  }));
  const [variants, setVariants] = useState<VariantState>(() =>
    buildInitialVariants(
      props.initial?.post.baseContent ?? "",
      props.initial?.variants,
    ),
  );
  const [scheduleAt, setScheduleAt] = useState("");
  const [pending, startTransition] = useTransition();

  const campaigns = props.campaignsByApp[appId] ?? [];

  const issues = useMemo(
    () => analyzeConfidence(baseContent),
    [baseContent],
  );

  const labels = useMemo(
    () => checklistLabels(launchDay),
    [launchDay],
  );

  function syncChecklistForLaunch(next: boolean) {
    setLaunchDay(next);
    setChecklist((prev) => ({
      ...defaultChecklist(next),
      ...prev,
      ...defaultChecklist(next),
    }));
  }

  async function persistDraft(): Promise<string | null> {
    if (!appId) {
      toast.error("Choose an app to promote.");
      return null;
    }
    const payload = {
      appId,
      campaignId,
      baseContent,
      launchDayMode: launchDay,
      isEvergreen: evergreen,
      energyTag: energyTag || null,
      founderChecklistJson: checklist,
      variants: PLATFORMS.map((p) => ({
        platform: p,
        content: variants[p].content,
        tone: variants[p].tone,
      })),
    };
    const res = await savePost(postId, payload);
    if ("error" in res && res.error) {
      toast.error("Could not save draft.");
      return null;
    }
    const id = res.id ?? postId;
    if (id) setPostId(id);
    router.refresh();
    return id;
  }

  function handleSave() {
    startTransition(async () => {
      const id = await persistDraft();
      if (id) toast.success("Draft saved.");
    });
  }

  function handleSchedule() {
    if (!scheduleAt) {
      toast.error("Pick a date and time.");
      return;
    }
    startTransition(async () => {
      const id = await persistDraft();
      if (!id) return;
      const res = await schedulePost(
        id,
        new Date(scheduleAt).toISOString(),
      );
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success("Scheduled. It will appear in Ready when due.");
      router.push("/queue");
    });
  }

  function handleGenerateVariants() {
    startTransition(async () => {
      let id = postId ?? props.initial?.post.id ?? null;
      if (!id) {
        id = await persistDraft();
      }
      if (!id) {
        toast.error("Save the draft first.");
        return;
      }
      await ensureVariantsFromBase(id, baseContent);
      setVariants(buildInitialVariants(baseContent));
      toast.success("Variants refreshed from your base copy.");
      router.refresh();
    });
  }

  async function handleAi(platform: PlatformId) {
    startTransition(async () => {
      const res = await aiRewriteVariant({
        base: variants[platform].content || baseContent,
        platform,
        tone: variants[platform].tone,
      });
      if ("skipped" in res && res.skipped) {
        toast.message(res.reason);
        return;
      }
      if ("text" in res && res.text) {
        setVariants((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], content: res.text },
        }));
        toast.success("AI rewrite applied.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app">App</Label>
                <select
                  id="app"
                  className={cn(
                    "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm",
                  )}
                  value={appId}
                  onChange={(e) => {
                    setAppId(e.target.value);
                    setCampaignId(null);
                  }}
                  required
                >
                  <option value="">Select…</option>
                  {props.apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (optional)</Label>
                <select
                  id="campaign"
                  className={cn(
                    "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm",
                  )}
                  value={campaignId ?? ""}
                  onChange={(e) =>
                    setCampaignId(e.target.value || null)
                  }
                >
                  <option value="">None</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base">Base copy</Label>
              <Textarea
                id="base"
                value={baseContent}
                onChange={(e) => {
                  setBaseContent(e.target.value);
                  setVariants((prev) => {
                    const next = { ...prev };
                    for (const p of PLATFORMS) {
                      if (!next[p].content) {
                        const tone = next[p].tone;
                        next[p] = {
                          ...next[p],
                          content: applyTonePreset(e.target.value, p, tone),
                        };
                      }
                    }
                    return next;
                  });
                }}
                placeholder="What are you shipping or teaching today?"
                rows={6}
              />
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {baseContent.trim().length} chars (base)
                </Badge>
                {issues.length > 0 && (
                  <Badge variant="destructive">
                    {issues.length} confidence flags
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={launchDay}
                  onCheckedChange={(v) =>
                    syncChecklistForLaunch(Boolean(v))
                  }
                />
                Launch day mode
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={evergreen}
                  onCheckedChange={(v) => setEvergreen(Boolean(v))}
                />
                Evergreen (eligible to resurface)
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="energy">Energy tag</Label>
                <select
                  id="energy"
                  className="flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm"
                  value={energyTag}
                  onChange={(e) =>
                    setEnergyTag(e.target.value as "" | "high" | "low")
                  }
                >
                  <option value="">Not set</option>
                  <option value="high">High energy</option>
                  <option value="low">Low energy</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule for</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSave} disabled={pending}>
                Save draft
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSchedule}
                disabled={pending}
              >
                Save & schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateVariants}
                disabled={pending}
              >
                Reset variants from base
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href="/compose/batch">Batch mode</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform variants</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="linkedin">
              <TabsList className="flex h-auto w-full flex-wrap gap-1 overflow-x-auto">
                {PLATFORMS.map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs sm:text-sm">
                    {PLATFORM_LABELS[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {PLATFORMS.map((p) => (
                <TabsContent key={p} value={p} className="space-y-3 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                      value={variants[p].tone}
                      onChange={(e) => {
                        const tone = e.target.value as TonePreset;
                        setVariants((prev) => ({
                          ...prev,
                          [p]: {
                            tone,
                            content: applyTonePreset(
                              baseContent || prev[p].content,
                              p,
                              tone,
                            ),
                          },
                        }));
                      }}
                    >
                      <option value="raw">Raw</option>
                      <option value="pro">Professional</option>
                      <option value="punchy">Punchy</option>
                      <option value="warm">Warm</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleAi(p)}
                    >
                      AI rewrite
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const text =
                          variants[p].content || baseContent;
                        void navigator.clipboard.writeText(text);
                        toast.success("Copied for " + PLATFORM_LABELS[p]);
                      }}
                    >
                      Copy text
                    </Button>
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <a
                        href={getComposerDeepLink(p, variants[p].content)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open composer
                      </a>
                    </Button>
                  </div>
                  <Textarea
                    rows={8}
                    value={variants[p].content}
                    onChange={(e) =>
                      setVariants((prev) => ({
                        ...prev,
                        [p]: { ...prev[p], content: e.target.value },
                      }))
                    }
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {variants[p].content.length} chars · Recommended caps vary
                    by platform (manual post in v1).
                  </p>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              Images are stripped of EXIF/GPS before upload. Alt text is required.
            </p>
            {(postId || props.initial?.post.id) && (
              <form
                action={async (fd) => {
                  const id = postId ?? props.initial?.post.id;
                  if (!id) return;
                  const res = await uploadPostMedia(id, fd);
                  if ("error" in res && res.error) toast.error(res.error);
                  else {
                    toast.success("Image uploaded.");
                    router.refresh();
                  }
                }}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor="file">Image</Label>
                  <Input id="file" name="file" type="file" accept="image/*" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="alt">Alt text</Label>
                  <Input id="alt" name="alt" placeholder="Describe the image" />
                </div>
                <Button type="submit">Upload</Button>
              </form>
            )}
            {!postId && !props.initial?.post.id && (
              <p className="text-sm text-[var(--color-text-muted)]">
                Save the draft to attach media.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {(props.initial?.media ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.blobUrl}
                    alt={m.altText}
                    className="max-h-40 w-full rounded-[var(--radius-sm)] object-cover"
                  />
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {m.altText}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteMedia(m.id);
                        toast.success("Removed from draft.");
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Founder checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(labels).map(([key, label]) => (
              <label key={key} className="flex gap-2 text-sm leading-snug">
                <Checkbox
                  checked={Boolean(checklist[key])}
                  onCheckedChange={(v) =>
                    setChecklist((prev) => ({
                      ...prev,
                      [key]: Boolean(v),
                    }))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Confidence pass</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">
                No common hedging patterns detected in base copy.
              </p>
            )}
            <ScrollArea className="max-h-60 pr-3">
              <ul className="space-y-2">
                {issues.map((issue: ConfidenceIssue, idx: number) => (
                  <li
                    key={`${issue.start}-${idx}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm"
                  >
                    <p className="font-medium">
                      “{baseContent.slice(issue.start, issue.end)}”
                    </p>
                    <p className="text-[var(--color-text-muted)]">
                      {issue.suggestion}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0"
                      onClick={() => {
                        const next = stripIssue(baseContent, issue);
                        setBaseContent(next);
                      }}
                    >
                      Remove this phrase
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <p className="text-xs text-[var(--color-text-muted)]">
          v1 posts manually — copy variants and mark as posted from the queue
          when live.
        </p>
      </div>
    </div>
  );
}
