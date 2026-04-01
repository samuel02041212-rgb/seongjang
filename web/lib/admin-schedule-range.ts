/** 레거시 server.js `clampRange` 와 동일 취지: from/to 파싱·최대 구간 제한 */
export function clampScheduleRange(from: string | null, to: string | null): {
  ok: true;
  fromAt: Date;
  toAt: Date;
} | { ok: false } {
  const f = from ? new Date(from) : null;
  const t = to ? new Date(to) : null;
  if (f && Number.isNaN(f.getTime())) return { ok: false };
  if (t && Number.isNaN(t.getTime())) return { ok: false };
  const now = new Date();
  const fromAt = f ?? new Date(now.getTime() - 45 * 24 * 3600 * 1000);
  const toAt = t ?? new Date(now.getTime() + 45 * 24 * 3600 * 1000);
  if (toAt.getTime() - fromAt.getTime() > 400 * 24 * 3600 * 1000) {
    return { ok: false };
  }
  return { ok: true, fromAt, toAt };
}
