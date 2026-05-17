export const FEED_TZ = "Asia/Seoul";

export function feedTodayIso(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: FEED_TZ });
}

export function feedDateLabel(iso: string): string {
  const noon = new Date(`${iso}T12:00:00+09:00`);
  return noon.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: FEED_TZ,
  });
}

export function feedDateAddDays(iso: string, days: number): string {
  const t = new Date(`${iso}T12:00:00+09:00`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toLocaleDateString("en-CA", { timeZone: FEED_TZ });
}

export function feedDateRangeUtc(iso: string): { gte: Date; lt: Date } {
  const gte = new Date(`${iso}T00:00:00+09:00`);
  const lt = new Date(`${feedDateAddDays(iso, 1)}T00:00:00+09:00`);
  return { gte, lt };
}

export function isFeedDateIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}
