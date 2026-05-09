import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from "date-fns";
import type { EnergyTag, Weekday } from "@/lib/constants";
import { listEnergySlots } from "@/lib/data";

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DEFAULT_HIGH_HOUR = 9; // 9:30am if no slots configured
const DEFAULT_HIGH_MIN = 30;
const DEFAULT_LOW_HOUR = 14; // 2:00pm
const DEFAULT_LOW_MIN = 0;

export type SuggestionResult = {
  /** ISO datetime suggested for the post. */
  iso: string;
  /** Window the suggestion came from, for UI hinting. */
  reason:
    | { kind: "next-energy-slot"; energy: EnergyTag; weekday: Weekday }
    | { kind: "default-high-energy" }
    | { kind: "default-low-energy" }
    | { kind: "next-day-fallback" };
};

function startOfDay(d: Date): Date {
  return setMilliseconds(setSeconds(setMinutes(setHours(d, 0), 0), 0), 0);
}

/**
 * Given an optional energy preference, suggest the next slot that fits it.
 * - If the user has configured `energySlots`, pick the soonest one in the
 *   future that matches the requested energy (or any slot if no preference).
 * - Otherwise fall back to a sensible default (high → 9:30am tomorrow,
 *   low → 2:00pm tomorrow).
 */
export async function suggestNextSlot(
  energyTag: EnergyTag | null,
  after: Date = new Date(),
): Promise<SuggestionResult> {
  const slots = await listEnergySlots();
  const matching = energyTag
    ? slots.filter((s) => s.energy === energyTag)
    : slots;

  if (matching.length > 0) {
    // Look up to 14 days ahead for the next matching slot.
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const day = addDays(after, dayOffset);
      const weekdayIdx = day.getDay();
      const dayStart = startOfDay(day);
      const slotsToday = matching.filter(
        (s) => WEEKDAY_INDEX[s.weekday as Weekday] === weekdayIdx,
      );
      for (const slot of slotsToday.sort(
        (a, b) => a.startMinutes - b.startMinutes,
      )) {
        const candidate = new Date(dayStart);
        candidate.setMinutes(candidate.getMinutes() + slot.startMinutes);
        if (candidate.getTime() > after.getTime()) {
          return {
            iso: candidate.toISOString(),
            reason: {
              kind: "next-energy-slot",
              energy: slot.energy as EnergyTag,
              weekday: slot.weekday as Weekday,
            },
          };
        }
      }
    }
  }

  // Fallback — tomorrow at the default hour for the requested energy.
  const tomorrow = addDays(after, 1);
  const isLow = energyTag === "low";
  const fallback = setMilliseconds(
    setSeconds(
      setMinutes(
        setHours(tomorrow, isLow ? DEFAULT_LOW_HOUR : DEFAULT_HIGH_HOUR),
        isLow ? DEFAULT_LOW_MIN : DEFAULT_HIGH_MIN,
      ),
      0,
    ),
    0,
  );
  return {
    iso: fallback.toISOString(),
    reason: isLow
      ? { kind: "default-low-energy" }
      : { kind: "default-high-energy" },
  };
}

/** Human-readable hint for the Compose schedule card. */
export function describeSlotReason(reason: SuggestionResult["reason"]): string {
  switch (reason.kind) {
    case "next-energy-slot":
      return reason.energy === "high"
        ? "Your high-energy window"
        : "Your low-energy window";
    case "default-high-energy":
      return "Suggested high-energy slot — set yours in Settings";
    case "default-low-energy":
      return "Suggested low-energy slot — set yours in Settings";
    case "next-day-fallback":
      return "Suggested slot — adjust freely";
  }
}
