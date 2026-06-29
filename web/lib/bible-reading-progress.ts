import type { BibleReadingRange } from "@/lib/bible-reading-ref";
import { parseBibleReadingRanges } from "@/lib/bible-reading-ref";
import {
  bookIndex,
  getKrvBibleStats,
  verseCountInChapter,
  type KrvBibleStats,
} from "@/lib/krv-bible-stats";

export type ReadingProgressJson = {
  totalPercent: number;
  oldTestamentPercent: number;
  newTestamentPercent: number;
  lastMeditation: LastMeditationJson | null;
};

export type LastMeditationJson = {
  range: string;
  date: string;
};

export type UserReadingStatusJson = {
  readingProgress: ReadingProgressJson;
  recentMeditations: LastMeditationJson[];
};

type PostReadingSource = {
  createdAt: Date;
  bibleRef: string;
  bibleReadingRanges: unknown;
  bibleBookKey: string | null;
  bibleChapterStart: number | null;
  bibleVerseStart: number | null;
  bibleChapterEnd: number | null;
  bibleVerseEnd: number | null;
};

function verseKey(bookKey: string, chapter: number, verse: number): string {
  return `${bookKey}:${chapter}:${verse}`;
}

function expandRange(
  range: BibleReadingRange,
  stats: KrvBibleStats,
): string[] {
  const bookStats = stats.books[range.bibleBookKey];
  if (!bookStats) return [];

  const startChapter = range.bibleChapterStart;
  const startVerse = range.bibleVerseStart;
  const hasEnd =
    range.bibleChapterEnd != null || range.bibleVerseEnd != null;

  if (!hasEnd) {
    if (verseCountInChapter(stats, range.bibleBookKey, startChapter) < startVerse) {
      return [];
    }
    return [verseKey(range.bibleBookKey, startChapter, startVerse)];
  }

  const endChapter = range.bibleChapterEnd ?? startChapter;
  const keys: string[] = [];

  for (let chapter = startChapter; chapter <= endChapter; chapter += 1) {
    const maxVerse = verseCountInChapter(stats, range.bibleBookKey, chapter);
    if (maxVerse < 1) continue;

    const verseStart = chapter === startChapter ? startVerse : 1;
    let verseEnd = maxVerse;
    if (chapter === endChapter) {
      verseEnd = range.bibleVerseEnd ?? maxVerse;
    }

    for (let verse = verseStart; verse <= verseEnd; verse += 1) {
      if (verse > maxVerse) break;
      keys.push(verseKey(range.bibleBookKey, chapter, verse));
    }
  }

  return keys;
}

function rangesFromPost(post: PostReadingSource): BibleReadingRange[] {
  const parsed = parseBibleReadingRanges(post.bibleReadingRanges);
  if (parsed.length > 0) return parsed;

  if (
    post.bibleBookKey &&
    post.bibleChapterStart != null &&
    post.bibleVerseStart != null
  ) {
    return [
      {
        bibleBookKey: post.bibleBookKey,
        bibleChapterStart: post.bibleChapterStart,
        bibleVerseStart: post.bibleVerseStart,
        bibleChapterEnd: post.bibleChapterEnd,
        bibleVerseEnd: post.bibleVerseEnd,
      },
    ];
  }

  return [];
}

function parseVerseKey(key: string) {
  const [bookKey, chapterRaw, verseRaw] = key.split(":");
  return {
    bookKey: bookKey ?? "",
    chapter: parseInt(chapterRaw ?? "0", 10),
    verse: parseInt(verseRaw ?? "0", 10),
    bookIdx: bookIndex(bookKey ?? ""),
  };
}

function percent(read: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((read / total) * 1000) / 10;
}

function formatMeditationDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function meditationFromPost(post: PostReadingSource): LastMeditationJson | null {
  const range = post.bibleRef.trim();
  if (!range) return null;
  return { range, date: formatMeditationDate(post.createdAt) };
}

export function computeUserReadingStatus(
  posts: PostReadingSource[],
): UserReadingStatusJson {
  const stats = getKrvBibleStats();
  const readVerses = new Set<string>();

  for (const post of posts) {
    for (const range of rangesFromPost(post)) {
      for (const key of expandRange(range, stats)) {
        readVerses.add(key);
      }
    }
  }

  let otRead = 0;
  let ntRead = 0;
  for (const key of readVerses) {
    const { bookIdx } = parseVerseKey(key);
    if (bookIdx < 0) continue;
    if (bookIdx < 39) otRead += 1;
    else ntRead += 1;
  }

  const structuredPosts = posts.filter(
    (post) => rangesFromPost(post).length > 0 && post.bibleRef.trim(),
  );
  const lastMeditation = structuredPosts[0]
    ? meditationFromPost(structuredPosts[0])
    : null;

  const recentMeditations = posts
    .map(meditationFromPost)
    .filter((item): item is LastMeditationJson => item != null)
    .slice(0, 8);

  const totalRead = otRead + ntRead;
  return {
    readingProgress: {
      totalPercent: percent(totalRead, stats.totalVerses),
      oldTestamentPercent: percent(otRead, stats.otTotalVerses),
      newTestamentPercent: percent(ntRead, stats.ntTotalVerses),
      lastMeditation,
    },
    recentMeditations,
  };
}

export function hasStructuredReading(post: PostReadingSource): boolean {
  return rangesFromPost(post).length > 0;
}
