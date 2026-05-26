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

export function isFeedDatePastOrToday(iso: string): boolean {
  if (!isFeedDateIso(iso)) return false;
  return iso <= feedTodayIso();
}

/** 선택한 피드 날짜 + 현재 KST 시각 */
export function buildCreatedAtForFeedDate(feedDateIso: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: FEED_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "00";
  const h = pick("hour");
  const m = pick("minute");
  const s = pick("second");
  return new Date(`${feedDateIso}T${h}:${m}:${s}+09:00`);
}

export function formatComposerFeedDate(iso: string): string {
  return new Date(`${iso}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
    timeZone: FEED_TZ,
    month: "numeric",
    day: "numeric",
  });
}
