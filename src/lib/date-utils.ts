/** Preserve clock time when moving a scheduled datetime to another calendar day (local). */
export function mergeKeepLocalTime(
  scheduled: Date | string | null | undefined,
  targetDay: Date,
): Date {
  const base = scheduled ? new Date(scheduled) : new Date();
  const next = new Date(targetDay);
  next.setHours(
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  );
  return next;
}
