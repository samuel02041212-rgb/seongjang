import fs from "fs";
import path from "path";

import { KRV_BOOK_ORDER } from "@/lib/krvBookOrder";

export type KrvBookStats = {
  chapters: Record<number, number>;
  totalVerses: number;
};

export type KrvBibleStats = {
  books: Record<string, KrvBookStats>;
  otTotalVerses: number;
  ntTotalVerses: number;
  totalVerses: number;
};

let cached: KrvBibleStats | null = null;

export function getKrvBibleStats(): KrvBibleStats {
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "public/bible/krv.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as Record<
    string,
    Record<string, Record<string, string>>
  >;

  const books: Record<string, KrvBookStats> = {};
  let otTotalVerses = 0;
  let ntTotalVerses = 0;

  for (let i = 0; i < KRV_BOOK_ORDER.length; i += 1) {
    const bookKey = KRV_BOOK_ORDER[i]!;
    const bookData = data[bookKey];
    if (!bookData) continue;

    const chapters: Record<number, number> = {};
    let totalVerses = 0;
    for (const chKey of Object.keys(bookData)) {
      const chapter = parseInt(chKey, 10);
      if (!Number.isFinite(chapter)) continue;
      const verseCount = Object.keys(bookData[chKey] ?? {}).length;
      chapters[chapter] = verseCount;
      totalVerses += verseCount;
    }

    books[bookKey] = { chapters, totalVerses };
    if (i < 39) otTotalVerses += totalVerses;
    else ntTotalVerses += totalVerses;
  }

  cached = {
    books,
    otTotalVerses,
    ntTotalVerses,
    totalVerses: otTotalVerses + ntTotalVerses,
  };
  return cached;
}

export function bookIndex(bookKey: string): number {
  return (KRV_BOOK_ORDER as readonly string[]).indexOf(bookKey);
}

export function verseCountInChapter(
  stats: KrvBibleStats,
  bookKey: string,
  chapter: number,
): number {
  return stats.books[bookKey]?.chapters[chapter] ?? 0;
}
