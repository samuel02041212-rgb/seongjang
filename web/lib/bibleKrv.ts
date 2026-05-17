export type KrvBibleJson = Record<
  string,
  Record<string, Record<string, string>>
>;

/** `창1:1`, `요 3:16` 형태 → 해당 장으로 이동 (절은 스크롤용으로 반환) */
export function tryParseKrvRef(raw: string): {
  book: string;
  chapter: string;
  verse?: string;
} | null {
  const q = raw.trim();
  const m = q.match(/^([가-힣]+)\s*(\d+)\s*:\s*(\d+)/);
  if (!m) return null;
  return { book: m[1], chapter: m[2], verse: m[3] };
}
