"use client";

import {
  KRV_BOOK_FULL_NAMES,
  KRV_BOOK_ORDER,
} from "@/lib/krvBookOrder";
import {
  isKrvBookKey,
  parsePositiveInt,
  validateBibleRange,
  type BibleReadingRange,
} from "@/lib/bible-reading-ref";
import { feedPostBibleRefClass } from "@/lib/feed-post-body-layout";

export type BibleRefRangeValue = {
  id: string;
  bibleBookKey: string;
  startChapter: string;
  startVerse: string;
  endChapter: string;
  endVerse: string;
};

export type BibleRefInputValue = {
  ranges: BibleRefRangeValue[];
  otherReadingRef: string;
};

let rangeSeq = 0;

function newRangeId() {
  rangeSeq += 1;
  return `range-${rangeSeq}`;
}

export function emptyBibleRefRangeValue(): BibleRefRangeValue {
  return {
    id: newRangeId(),
    bibleBookKey: "",
    startChapter: "",
    startVerse: "",
    endChapter: "",
    endVerse: "",
  };
}

export const emptyBibleRefInputValue = (): BibleRefInputValue => ({
  ranges: [emptyBibleRefRangeValue()],
  otherReadingRef: "",
});

function isRangeEmpty(range: BibleRefRangeValue): boolean {
  return !(
    range.bibleBookKey ||
    range.startChapter.trim() ||
    range.startVerse.trim() ||
    range.endChapter.trim() ||
    range.endVerse.trim()
  );
}

function isRangeComplete(range: BibleRefRangeValue): boolean {
  return !!(
    range.bibleBookKey &&
    parsePositiveInt(range.startChapter) != null &&
    parsePositiveInt(range.startVerse) != null
  );
}

function validateSingleRange(range: BibleRefRangeValue): string | null {
  if (isRangeEmpty(range)) return null;
  const startChapter = parsePositiveInt(range.startChapter);
  const startVerse = parsePositiveInt(range.startVerse);
  const endChapter = parsePositiveInt(range.endChapter);
  const endVerse = parsePositiveInt(range.endVerse);

  if (!range.bibleBookKey || !isKrvBookKey(range.bibleBookKey)) {
    return "성경 권을 선택해 주세요.";
  }
  if (!startChapter) return "장을 입력해 주세요.";
  if (!startVerse) return "절을 입력해 주세요.";
  return validateBibleRange(startChapter, startVerse, endChapter, endVerse);
}

export function validateBibleRefInput(value: BibleRefInputValue): string | null {
  let hasCompleteRange = false;
  for (let i = 0; i < value.ranges.length; i += 1) {
    const range = value.ranges[i]!;
    if (isRangeEmpty(range)) continue;
    const err = validateSingleRange(range);
    if (err) return `${i + 1}번째 범위: ${err}`;
    hasCompleteRange = true;
  }
  if (hasCompleteRange) return null;
  if (value.otherReadingRef.trim()) return null;
  return null;
}

export function isBibleRefInputFilled(value: BibleRefInputValue): boolean {
  if (validateBibleRefInput(value)) return false;
  const hasCompleteRange = value.ranges.some(
    (range) => !isRangeEmpty(range) && isRangeComplete(range),
  );
  const other = value.otherReadingRef.trim();
  const hasPartialBible = value.ranges.some((range) => !isRangeEmpty(range));
  return hasCompleteRange || (!!other && !hasPartialBible);
}

export function bibleRefInputToPayload(value: BibleRefInputValue): {
  bibleReadingRanges?: BibleReadingRange[];
  otherReadingRef?: string;
} {
  const bibleReadingRanges = value.ranges
    .filter(isRangeComplete)
    .map((range) => ({
      bibleBookKey: range.bibleBookKey,
      bibleChapterStart: parsePositiveInt(range.startChapter)!,
      bibleVerseStart: parsePositiveInt(range.startVerse)!,
      bibleChapterEnd: parsePositiveInt(range.endChapter) ?? null,
      bibleVerseEnd: parsePositiveInt(range.endVerse) ?? null,
    }));
  if (bibleReadingRanges.length > 0) {
    return { bibleReadingRanges };
  }
  const other = value.otherReadingRef.trim();
  if (other) return { otherReadingRef: other };
  return {};
}

type BibleRefInputProps = {
  value: BibleRefInputValue;
  onChange: (value: BibleRefInputValue) => void;
  className?: string;
  titleSet?: boolean;
};

const fieldClass =
  "min-w-0 rounded border border-line/70 bg-bg/60 px-1.5 py-0.5 text-xs text-ink outline-none focus:border-accent";

function BibleRefRangeRow({
  range,
  showError,
  onChange,
  onRemove,
  removable,
}: {
  range: BibleRefRangeValue;
  showError: boolean;
  onChange: (next: BibleRefRangeValue) => void;
  onRemove?: () => void;
  removable: boolean;
}) {
  function patch(next: Partial<BibleRefRangeValue>) {
    onChange({ ...range, ...next });
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      <select
        value={range.bibleBookKey}
        onChange={(e) => patch({ bibleBookKey: e.target.value })}
        className={`${fieldClass} max-w-[9.5rem]`}
        aria-label="성경 권"
      >
        <option value="">성경 선택</option>
        {KRV_BOOK_ORDER.map((key, i) => (
          <option key={key} value={key}>
            {KRV_BOOK_FULL_NAMES[i]}
          </option>
        ))}
      </select>
      <input
        type="number"
        min={1}
        value={range.startChapter}
        onChange={(e) => patch({ startChapter: e.target.value })}
        placeholder="장"
        className={`${fieldClass} w-11 ${showError ? "border-red-400" : ""}`}
        aria-label="시작 장"
        disabled={!range.bibleBookKey}
      />
      <span className="text-muted">:</span>
      <input
        type="number"
        min={1}
        value={range.startVerse}
        onChange={(e) => patch({ startVerse: e.target.value })}
        placeholder="절"
        className={`${fieldClass} w-11 ${showError ? "border-red-400" : ""}`}
        aria-label="시작 절"
        disabled={!range.bibleBookKey}
      />
      <span className="text-muted/70">—</span>
      <input
        type="number"
        min={1}
        value={range.endChapter}
        onChange={(e) => patch({ endChapter: e.target.value })}
        placeholder="장"
        className={`${fieldClass} w-11 ${showError ? "border-red-400" : ""}`}
        aria-label="끝 장"
        disabled={!range.bibleBookKey}
      />
      <span className="text-muted">:</span>
      <input
        type="number"
        min={1}
        value={range.endVerse}
        onChange={(e) => patch({ endVerse: e.target.value })}
        placeholder="절"
        className={`${fieldClass} w-11 ${showError ? "border-red-400" : ""}`}
        aria-label="끝 절"
        disabled={!range.bibleBookKey}
      />
      {removable ? (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted transition hover:bg-accent-soft hover:text-ink"
          aria-label="범위 삭제"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export function BibleRefInput({
  value,
  onChange,
  className = "",
  titleSet = false,
}: BibleRefInputProps) {
  const validationError = validateBibleRefInput(value);

  function patch(next: Partial<BibleRefInputValue>) {
    onChange({ ...value, ...next });
  }

  function updateRange(index: number, next: BibleRefRangeValue) {
    const ranges = [...value.ranges];
    ranges[index] = next;
    patch({ ranges });
  }

  function addRange() {
    patch({ ranges: [...value.ranges, emptyBibleRefRangeValue()] });
  }

  function removeRange(index: number) {
    patch({ ranges: value.ranges.filter((_, i) => i !== index) });
  }

  return (
    <div className={`${titleSet ? "mt-1" : ""} ${className}`}>
      <div
        className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-2 ${feedPostBibleRefClass}`}
      >
        <div className="min-w-0 flex-1 space-y-2">
          {value.ranges.map((range, index) => {
            const rangeError =
              !isRangeEmpty(range) ? validateSingleRange(range) : null;
            const showRangeError = !!rangeError;
            return (
              <div key={range.id} className="flex flex-wrap items-center gap-2">
                <BibleRefRangeRow
                  range={range}
                  showError={showRangeError}
                  onChange={(next) => updateRange(index, next)}
                  onRemove={() => removeRange(index)}
                  removable={value.ranges.length > 1}
                />
                {index === value.ranges.length - 1 ? (
                  <button
                    type="button"
                    onClick={addRange}
                    className="shrink-0 rounded border border-line bg-bg/60 px-2 py-0.5 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-ink"
                  >
                    + 범위 추가
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="flex min-w-[10rem] items-center gap-1.5">
          <span className="shrink-0 text-xs text-muted">기타</span>
          <input
            type="text"
            value={value.otherReadingRef}
            onChange={(e) => patch({ otherReadingRef: e.target.value })}
            placeholder="읽은 책·범위"
            className={`${fieldClass} min-w-[7rem] flex-1`}
          />
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">
        성경 범위를 정확히 입력하지 않으면 통독 현황에 제대로 반영되지 않을 수
        있습니다. 책이 넘어가면 범위를 나눠 입력해 주세요. 기타는 통독 현황에
        반영되지 않습니다.
      </p>
      {validationError ? (
        <p className="mt-1 text-[11px] text-red-700">{validationError}</p>
      ) : null}
    </div>
  );
}
