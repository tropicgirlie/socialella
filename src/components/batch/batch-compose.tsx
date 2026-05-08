"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { apps } from "@/db/schema";
import { savePost } from "@/actions/posts";
import { PLATFORMS } from "@/lib/constants";
import { defaultToneForPlatform } from "@/lib/tone";
import { applyTonePreset } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AppRow = typeof apps.$inferSelect;

export function BatchCompose(props: { apps: AppRow[] }) {
  const router = useRouter();
  const [cards, setCards] = useState(
    Array.from({ length: 5 }).map(() => ({
      appId: props.apps[0]?.id ?? "",
      base: "",
    })),
  );
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  function updateCard(
    index: number,
    patch: Partial<{ appId: string; base: string }>,
  ) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function handleSaveAll() {
    startTransition(async () => {
      let saved = 0;
      for (const card of cards) {
        if (!card.appId || !card.base.trim()) continue;
        const variants = PLATFORMS.map((p) => {
          const tone = defaultToneForPlatform(p);
          return {
            platform: p,
            content: applyTonePreset(card.base, p, tone),
            tone,
          };
        });
        const res = await savePost(null, {
          appId: card.appId,
          campaignId: null,
          baseContent: card.base,
          launchDayMode: false,
          isEvergreen: false,
          energyTag: null,
          founderChecklistJson: {},
          variants,
        });
        if ("error" in res && res.error) {
          toast.error("One card failed to save.");
          continue;
        }
        saved++;
      }
      if (saved === 0) {
        toast.error("Add app + copy for at least one card.");
        return;
      }
      toast.success(`Saved ${saved} drafts.`);
      router.push("/library");
    });
  }

  const current = cards[step];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--color-text-muted)]">
          Card {step + 1} of {cards.length}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={step >= cards.length - 1}
            onClick={() =>
              setStep((s) => Math.min(cards.length - 1, s + 1))
            }
          >
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Focused draft</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app">App</Label>
            <select
              id="app"
              className={cn(
                "flex h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 text-sm",
              )}
              value={current.appId}
              onChange={(e) => updateCard(step, { appId: e.target.value })}
            >
              {props.apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="base">Post</Label>
            <Textarea
              id="base"
              rows={8}
              value={current.base}
              onChange={(e) => updateCard(step, { base: e.target.value })}
              placeholder="Ship in batches — one focused card at a time."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={handleSaveAll} disabled={pending}>
          Save all filled cards
        </Button>
      </div>
    </div>
  );
}
