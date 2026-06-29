import { KRV_BOOK_ORDER, getKrvBookLabel } from "@/lib/krvBookOrder";

export type BibleReadingRange = {
  bibleBookKey: string;
  bibleChapterStart: number;
  bibleVerseStart: number;
  bibleChapterEnd?: number | null;
  bibleVerseEnd?: number | null;
};

export type BibleReadingRefInput = {
  bibleReadingRanges?: BibleReadingRange[];
  bibleBookKey?: string;
  otherReadingRef?: string;
  bibleChapterStart?: number;
  bibleVerseStart?: number;
  bibleChapterEnd?: number;
  bibleVerseEnd?: number;
  bibleRef?: string;
};

export type BibleReadingRefData = {
  bibleRef: string;
  bibleReadingRanges: BibleReadingRange[];
  bibleBookKey: string | null;
  otherReadingRef: string | null;
  bibleChapterStart: number | null;
  bibleVerseStart: number | null;
  bibleChapterEnd: number | null;
  bibleVerseEnd: number | null;
};

export function isKrvBookKey(key: string): boolean {
  return (KRV_BOOK_ORDER as readonly string[]).includes(key);
}

export function formatBibleReadingRef(input: BibleReadingRange): string {
  const label = getKrvBookLabel(input.bibleBookKey);
  let ref = `${label} ${input.bibleChapterStart}:${input.bibleVerseStart}`;
  const endChapter = input.bibleChapterEnd ?? null;
  const endVerse = input.bibleVerseEnd ?? null;
  if (endChapter != null || endVerse != null) {
    if (endChapter != null && endChapter !== input.bibleChapterStart) {
      ref += ` — ${endChapter}${endVerse != null ? `:${endVerse}` : ""}`;
    } else if (endVerse != null && endVerse !== input.bibleVerseStart) {
      ref += ` — ${endVerse}`;
    }
  }
  return ref;
}

export function formatBibleReadingRanges(ranges: BibleReadingRange[]): string {
  return ranges.map(formatBibleReadingRef).join(" · ");
}

function validateReadingRange(
  range: BibleReadingRange,
  index: number,
): string | null {
  if (!isKrvBookKey(range.bibleBookKey)) {
    return `${index + 1}번째 범위: 성경 권을 선택해 주세요.`;
  }
  if (!range.bibleChapterStart || range.bibleChapterStart < 1) {
    return `${index + 1}번째 범위: 장을 입력해 주세요.`;
  }
  if (!range.bibleVerseStart || range.bibleVerseStart < 1) {
    return `${index + 1}번째 범위: 절을 입력해 주세요.`;
  }
  const rangeError = validateBibleRange(
    range.bibleChapterStart,
    range.bibleVerseStart,
    range.bibleChapterEnd,
    range.bibleVerseEnd,
  );
  if (rangeError) {
    return `${index + 1}번째 범위: ${rangeError}`;
  }
  return null;
}

function normalizeRanges(
  ranges: BibleReadingRange[],
): BibleReadingRange[] {
  return ranges.map((r) => ({
    bibleBookKey: r.bibleBookKey,
    bibleChapterStart: r.bibleChapterStart,
    bibleVerseStart: r.bibleVerseStart,
    bibleChapterEnd: r.bibleChapterEnd ?? null,
    bibleVerseEnd: r.bibleVerseEnd ?? null,
  }));
}

function firstRangeFields(ranges: BibleReadingRange[]) {
  const first = ranges[0];
  if (!first) {
    return {
      bibleBookKey: null,
      bibleChapterStart: null,
      bibleVerseStart: null,
      bibleChapterEnd: null,
      bibleVerseEnd: null,
    };
  }
  return {
    bibleBookKey: first.bibleBookKey,
    bibleChapterStart: first.bibleChapterStart,
    bibleVerseStart: first.bibleVerseStart,
    bibleChapterEnd: first.bibleChapterEnd ?? null,
    bibleVerseEnd: first.bibleVerseEnd ?? null,
  };
}

export function resolveReadingRef(
  input: BibleReadingRefInput,
): { ok: true; data: BibleReadingRefData } | { ok: false; error: string } {
  if (input.bibleReadingRanges?.length) {
    const ranges = normalizeRanges(input.bibleReadingRanges);
    for (let i = 0; i < ranges.length; i += 1) {
      const err = validateReadingRange(ranges[i]!, i);
      if (err) return { ok: false, error: err };
    }
    return {
      ok: true,
      data: {
        bibleRef: formatBibleReadingRanges(ranges),
        bibleReadingRanges: ranges,
        otherReadingRef: null,
        ...firstRangeFields(ranges),
      },
    };
  }

  const bookKey = input.bibleBookKey?.trim();
  if (bookKey && isKrvBookKey(bookKey)) {
    const range: BibleReadingRange = {
      bibleBookKey: bookKey,
      bibleChapterStart: input.bibleChapterStart!,
      bibleVerseStart: input.bibleVerseStart!,
      bibleChapterEnd: input.bibleChapterEnd ?? null,
      bibleVerseEnd: input.bibleVerseEnd ?? null,
    };
    const err = validateReadingRange(range, 0);
    if (err) return { ok: false, error: err };
    const ranges = normalizeRanges([range]);
    return {
      ok: true,
      data: {
        bibleRef: formatBibleReadingRanges(ranges),
        bibleReadingRanges: ranges,
        otherReadingRef: null,
        ...firstRangeFields(ranges),
      },
    };
  }

  const other = input.otherReadingRef?.trim();
  if (other) {
    return {
      ok: true,
      data: {
        bibleRef: other,
        bibleReadingRanges: [],
        bibleBookKey: null,
        otherReadingRef: other,
        bibleChapterStart: null,
        bibleVerseStart: null,
        bibleChapterEnd: null,
        bibleVerseEnd: null,
      },
    };
  }

  const legacy = input.bibleRef?.trim();
  if (legacy) {
    return {
      ok: true,
      data: {
        bibleRef: legacy,
        bibleReadingRanges: [],
        bibleBookKey: null,
        otherReadingRef: null,
        bibleChapterStart: null,
        bibleVerseStart: null,
        bibleChapterEnd: null,
        bibleVerseEnd: null,
      },
    };
  }

  return { ok: false, error: "성경 범위 또는 기타 읽은 범위를 입력해 주세요." };
}

export function validateBibleRange(
  startChapter: number,
  startVerse: number,
  endChapter?: number | null,
  endVerse?: number | null,
): string | null {
  if (endChapter == null && endVerse == null) return null;
  const effectiveEndChapter =
    endChapter ?? (endVerse != null ? startChapter : null);
  if (effectiveEndChapter != null && effectiveEndChapter < startChapter) {
    return "끝 장이 시작 장보다 앞설 수 없습니다.";
  }
  if (endVerse != null) {
    const cmpChapter = effectiveEndChapter ?? startChapter;
    if (cmpChapter === startChapter && endVerse < startVerse) {
      return "끝 절이 시작 절보다 앞설 수 없습니다.";
    }
  }
  return null;
}

export function parsePositiveInt(raw: string): number | undefined {
  const n = parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return n;
}

export function parseBibleReadingRanges(raw: unknown): BibleReadingRange[] {
  if (!Array.isArray(raw)) return [];
  const out: BibleReadingRange[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const bibleBookKey =
      typeof r.bibleBookKey === "string" ? r.bibleBookKey : "";
    const bibleChapterStart =
      typeof r.bibleChapterStart === "number" ? r.bibleChapterStart : 0;
    const bibleVerseStart =
      typeof r.bibleVerseStart === "number" ? r.bibleVerseStart : 0;
    if (!isKrvBookKey(bibleBookKey) || bibleChapterStart < 1 || bibleVerseStart < 1) {
      continue;
    }
    out.push({
      bibleBookKey,
      bibleChapterStart,
      bibleVerseStart,
      bibleChapterEnd:
        typeof r.bibleChapterEnd === "number" ? r.bibleChapterEnd : null,
      bibleVerseEnd:
        typeof r.bibleVerseEnd === "number" ? r.bibleVerseEnd : null,
    });
  }
  return out;
}
