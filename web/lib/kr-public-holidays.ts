const FIXED_MM_DD = new Set([
  "01-01",
  "03-01",
  "05-01",
  "05-05",
  "06-06",
  "08-15",
  "10-03",
  "10-09",
  "12-25",
]);

const EXTRA_ISO = new Set([
  "2023-01-21",
  "2023-01-22",
  "2023-01-23",
  "2023-01-24",
  "2023-05-27",
  "2023-05-29",
  "2023-09-28",
  "2023-09-29",
  "2023-09-30",
  "2023-10-02",
  "2024-02-09",
  "2024-02-10",
  "2024-02-11",
  "2024-02-12",
  "2024-04-10",
  "2024-05-06",
  "2024-05-15",
  "2024-09-16",
  "2024-09-17",
  "2024-09-18",
  "2024-10-01",
  "2025-01-27",
  "2025-01-28",
  "2025-01-29",
  "2025-01-30",
  "2025-03-03",
  "2025-05-06",
  "2025-06-03",
  "2025-10-05",
  "2025-10-06",
  "2025-10-07",
  "2025-10-08",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-02",
  "2026-05-24",
  "2026-05-25",
  "2026-06-03",
  "2026-08-17",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-10-05",
  "2027-02-06",
  "2027-02-08",
  "2027-05-03",
  "2027-05-13",
  "2027-09-14",
  "2027-09-15",
  "2027-09-16",
  "2027-10-11",
  "2028-01-26",
  "2028-01-27",
  "2028-05-02",
  "2028-10-02",
  "2028-10-04",
]);

export function isKrPublicHoliday(iso: string): boolean {
  if (FIXED_MM_DD.has(iso.slice(5))) return true;
  return EXTRA_ISO.has(iso);
}

export function kstDayOfWeek(iso: string): number {
  return new Date(`${iso}T12:00:00+09:00`).getUTCDay();
}

export function recordCalendarDayColorClass(iso: string): string {
  if (isKrPublicHoliday(iso) || kstDayOfWeek(iso) === 0) {
    return "text-red-600 dark:text-red-400";
  }
  if (kstDayOfWeek(iso) === 6) return "text-blue-600 dark:text-blue-400";
  return "text-ink";
}

export function recordCalendarWeekdayColorClass(index: number): string {
  if (index === 0) return "text-red-600 dark:text-red-400";
  if (index === 6) return "text-blue-600 dark:text-blue-400";
  return "text-muted";
}
