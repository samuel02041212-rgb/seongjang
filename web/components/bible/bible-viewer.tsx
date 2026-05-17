"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { tryParseKrvRef } from "@/lib/bibleKrv";
import type { KrvBibleJson } from "@/lib/bibleKrv";
import {
  getKrvBookLabel,
  KRV_BOOK_FULL_NAMES,
  KRV_BOOK_ORDER,
} from "@/lib/krvBookOrder";

type SearchHit = { book: string; ch: string; vs: string; text: string };

const SEARCH_MIN_LEN = 2;
const SEARCH_MAX_RESULTS = 60;

export function BibleViewer() {
  const [data, setData] = useState<KrvBibleJson | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [book, setBook] = useState("창");
  const [chapter, setChapter] = useState("1");
  const [searchQ, setSearchQ] = useState("");
  const deferredQ = useDeferredValue(searchQ.trim());
  const verseListRef = useRef<HTMLDivElement>(null);
  const [pendingVerse, setPendingVerse] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/bible/krv.json", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<KrvBibleJson>;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch(() => {
        if (!cancelled) setLoadError("성경 데이터를 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const chapters = useMemo(() => {
    if (!data?.[book]) return [];
    return Object.keys(data[book])
      .map((n) => parseInt(n, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)
      .map(String);
  }, [data, book]);

  const chapterNav = useMemo(() => {
    type Nav = { book: string; ch: string };
    if (!data) return { prev: null as Nav | null, next: null as Nav | null };
    const order = KRV_BOOK_ORDER as readonly string[];
    const bi = order.indexOf(book);
    const chIdx = chapters.indexOf(chapter);

    const keysFor = (b: string) => {
      const bd = data[b];
      if (!bd) return [] as string[];
      return Object.keys(bd)
        .map((n) => parseInt(n, 10))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b_) => a - b_)
        .map(String);
    };

    let prev: { book: string; ch: string } | null = null;
    if (chIdx > 0) {
      prev = { book, ch: chapters[chIdx - 1]! };
    } else if (bi > 0) {
      const pb = order[bi - 1]!;
      const pk = keysFor(pb);
      if (pk.length) prev = { book: pb, ch: pk[pk.length - 1]! };
    }

    let next: { book: string; ch: string } | null = null;
    if (chIdx >= 0 && chIdx < chapters.length - 1) {
      next = { book, ch: chapters[chIdx + 1]! };
    } else if (bi >= 0 && bi < order.length - 1) {
      const nb = order[bi + 1]!;
      const nk = keysFor(nb);
      if (nk.length) next = { book: nb, ch: nk[0]! };
    }

    return { prev, next };
  }, [data, book, chapter, chapters]);

  useEffect(() => {
    if (chapters.length && !chapters.includes(chapter)) {
      setChapter(chapters[0]!);
    }
  }, [chapters, chapter]);

  const verses = useMemo(() => {
    const ch = data?.[book]?.[chapter];
    if (!ch) return [];
    return Object.keys(ch)
      .map((v) => parseInt(v, 10))
      .filter((n) => !Number.isNaN(n))
      .sort((a, b) => a - b)
      .map((v) => ({ v: String(v), text: ch[String(v)] ?? "" }));
  }, [data, book, chapter]);

  useEffect(() => {
    if (!pendingVerse || !verses.length) return;
    if (!verses.some((x) => x.v === pendingVerse)) {
      setPendingVerse(null);
      return;
    }
    const el = verseListRef.current?.querySelector(
      `[data-verse="${CSS.escape(pendingVerse)}"]`,
    );
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      setPendingVerse(null);
    }
  }, [pendingVerse, verses, book, chapter]);

  const searchResults = useMemo((): SearchHit[] => {
    if (!data || deferredQ.length < SEARCH_MIN_LEN) return [];
    const ref = tryParseKrvRef(deferredQ);
    if (ref && data[ref.book]?.[ref.chapter]) {
      const ch = data[ref.book][ref.chapter];
      if (ref.verse && ch[ref.verse]) {
        return [
          {
            book: ref.book,
            ch: ref.chapter,
            vs: ref.verse,
            text: ch[ref.verse]!,
          },
        ];
      }
      return Object.keys(ch)
        .map((vs) => parseInt(vs, 10))
        .filter((n) => !Number.isNaN(n))
        .sort((a, b) => a - b)
        .slice(0, 40)
        .map((n) => {
          const vs = String(n);
          return {
            book: ref.book,
            ch: ref.chapter,
            vs,
            text: ch[vs] ?? "",
          };
        });
    }

    const q = deferredQ.toLowerCase();
    const hits: SearchHit[] = [];
    for (const b of KRV_BOOK_ORDER) {
      const bd = data[b];
      if (!bd) continue;
      const chKeys = Object.keys(bd).sort((a, c) => Number(a) - Number(c));
      for (const ch of chKeys) {
        const chObj = bd[ch];
        if (!chObj) continue;
        const vsKeys = Object.keys(chObj).sort((a, c) => Number(a) - Number(c));
        for (const vs of vsKeys) {
          const text = chObj[vs];
          if (text && text.toLowerCase().includes(q)) {
            hits.push({ book: b, ch, vs, text });
            if (hits.length >= SEARCH_MAX_RESULTS) return hits;
          }
        }
      }
    }
    return hits;
  }, [data, deferredQ]);

  function goToHit(h: SearchHit) {
    setBook(h.book);
    setChapter(h.ch);
    setSearchQ("");
    setPendingVerse(h.vs);
  }

  function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const ref = tryParseKrvRef(searchQ);
    if (!ref || !data?.[ref.book]?.[ref.chapter]) return;
    e.preventDefault();
    setBook(ref.book);
    setChapter(ref.chapter);
    setSearchQ("");
    setPendingVerse(ref.verse ?? null);
  }

  function jumpChapter(target: { book: string; ch: string }) {
    setBook(target.book);
    setChapter(target.ch);
    setPendingVerse(null);
    verseListRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loadError) {
    return <div className="med-bible-error">{loadError}</div>;
  }

  if (!data) {
    return <div className="med-bible-loading">성경 불러오는 중…</div>;
  }

  return (
    <div className="med-bible-inner">
      <label className="med-bible-sr" htmlFor="bibleSearch">
        성경 검색 (본문 또는 창1:1)
      </label>
      <input
        id="bibleSearch"
        type="search"
        className="med-bible-search"
        placeholder="본문 검색 또는 창1:1 · 요3:16"
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        onKeyDown={onSearchKeyDown}
        autoComplete="off"
      />

      {deferredQ.length >= SEARCH_MIN_LEN && (
        <div className="med-bible-results">
          {searchResults.length === 0 ? (
            <p className="med-bible-results-empty">결과 없음</p>
          ) : (
            <ul className="med-bible-results-list">
              {searchResults.map((h) => (
                <li key={`${h.book}-${h.ch}-${h.vs}`}>
                  <button
                    type="button"
                    className="med-bible-hit"
                    onClick={() => goToHit(h)}
                  >
                    <span className="med-bible-hit-ref">
                      {getKrvBookLabel(h.book)} {h.ch}:{h.vs}
                    </span>
                    <span className="med-bible-hit-txt">
                      {h.text.length > 72
                        ? `${h.text.slice(0, 72)}…`
                        : h.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="med-bible-nav">
        <label className="med-bible-sr" htmlFor="bibleBook">
          책
        </label>
        <select
          id="bibleBook"
          className="med-bible-select"
          value={book}
          onChange={(e) => setBook(e.target.value)}
        >
          {KRV_BOOK_ORDER.map((b, i) => (
            <option key={b} value={b}>
              {KRV_BOOK_FULL_NAMES[i] ?? b}
            </option>
          ))}
        </select>
        <label className="med-bible-sr" htmlFor="bibleChapter">
          장
        </label>
        <select
          id="bibleChapter"
          className="med-bible-select med-bible-chapter"
          value={chapter}
          onChange={(e) => setChapter(e.target.value)}
        >
          {chapters.map((c) => (
            <option key={c} value={c}>
              {c}장
            </option>
          ))}
        </select>
      </div>

      <div className="med-bible-verses" ref={verseListRef}>
        {verses.map(({ v, text }) => (
          <p key={v} className="med-bible-verse" data-verse={v}>
            <span className="med-bible-vno">{v}</span>
            {text}
          </p>
        ))}
      </div>

      <div className="med-bible-chapter-nav" role="group" aria-label="장 이동">
        <button
          type="button"
          className="med-bible-chapter-nav-btn"
          disabled={!chapterNav.prev}
          onClick={() => chapterNav.prev && jumpChapter(chapterNav.prev)}
          aria-label="이전 장"
        >
          <svg
            className="med-bible-tri"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden
          >
            <polygon points="2,7 11,2 11,12" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="med-bible-chapter-nav-btn"
          disabled={!chapterNav.next}
          onClick={() => chapterNav.next && jumpChapter(chapterNav.next)}
          aria-label="다음 장"
        >
          <svg
            className="med-bible-tri"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden
          >
            <polygon points="12,7 3,2 3,12" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
