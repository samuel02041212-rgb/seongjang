"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PostDetailModal } from "@/components/feed/post-detail-modal";
import { FEED_TZ, feedTodayIso } from "@/lib/feed-date";
import type { FeedPostJson } from "@/lib/feed-serialize";
import { postDisplayTitle } from "@/lib/group-post-msg";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function postFeedDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-CA", { timeZone: FEED_TZ });
}

function monthLabel(year: number, month: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00+09:00`).toLocaleDateString(
    "ko-KR",
    { timeZone: FEED_TZ, year: "numeric", month: "long" },
  );
}

function dayPanelLabel(iso: string) {
  return new Date(`${iso}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
    timeZone: FEED_TZ,
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatPostDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: FEED_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00+09:00`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function briefTitle(post: FeedPostJson): string {
  const label = postDisplayTitle(post);
  return label.length > 14 ? `${label.slice(0, 14)}…` : label;
}

export function RecordPageClient({ groupId }: { groupId?: string } = {}) {
  const today = feedTodayIso();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const url = groupId
          ? `/api/posts?groupId=${encodeURIComponent(groupId)}`
          : "/api/posts?mine=1";
        const res = await fetch(url, { credentials: "include" });
        const data = (await res.json()) as unknown;
        if (!cancelled) {
          setPosts(res.ok && Array.isArray(data) ? (data as FeedPostJson[]) : []);
        }
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  useEffect(() => {
    setSelectedDate(null);
  }, [year, month]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, FeedPostJson[]>();
    for (const p of posts) {
      const d = postFeedDate(p.createdAt);
      const list = map.get(d) ?? [];
      list.push(p);
      map.set(d, list);
    }
    return map;
  }, [posts]);

  const selectedPosts = selectedDate ? (postsByDate.get(selectedDate) ?? []) : [];

  const grid = useMemo(() => {
    const firstDow = new Date(
      `${year}-${String(month).padStart(2, "0")}-01T12:00:00+09:00`,
    ).getUTCDay();
    const days = new Date(year, month, 0).getDate();
    const cells: ({ day: number; iso: string } | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, iso });
    }
    return cells;
  }, [year, month]);

  const goMonthFixed = useCallback((delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }, [year, month]);

  const toggleDate = useCallback((iso: string, hasPosts: boolean) => {
    if (!hasPosts) return;
    setSelectedDate((prev) => (prev === iso ? null : iso));
  }, []);

  return (
    <div
      className={`mx-auto w-full pb-12 ${selectedDate ? "max-w-6xl" : "max-w-3xl"}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goMonthFixed(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink"
          aria-label="이전 달"
        >
          ‹
        </button>
        <h1 className="font-display text-base text-ink">{monthLabel(year, month)}</h1>
        <button
          type="button"
          onClick={() => goMonthFixed(1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="py-16 text-center text-sm text-muted">불러오는 중…</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
              <div className="grid grid-cols-7 border-b border-line bg-bg/80 text-center text-xs font-medium text-muted">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2.5">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {grid.map((cell, i) => {
                  if (!cell) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="min-h-[5.5rem] border-b border-r border-line/50 bg-bg/40"
                      />
                    );
                  }
                  const dayPosts = postsByDate.get(cell.iso) ?? [];
                  const isToday = cell.iso === today;
                  const isSelected = cell.iso === selectedDate;
                  const hasPosts = dayPosts.length > 0;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      disabled={!hasPosts}
                      onClick={() => toggleDate(cell.iso, hasPosts)}
                      className={`flex min-h-[5.5rem] flex-col border-b border-r border-line/50 p-1.5 text-left transition sm:min-h-[6.25rem] sm:p-2 ${
                        hasPosts
                          ? "bg-accent-soft/40 hover:bg-accent-soft/70"
                          : "cursor-default bg-surface"
                      } ${isToday ? "ring-1 ring-inset ring-accent/50" : ""} ${
                        isSelected ? "bg-accent-soft ring-2 ring-inset ring-accent" : ""
                      }`}
                    >
                      <span
                        className={`text-xs font-medium sm:text-sm ${
                          isToday ? "text-accent-foreground" : "text-ink"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasPosts ? (
                        <div className="pointer-events-none mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                          {dayPosts.map((post) => (
                            <span
                              key={post.id}
                              className="truncate text-[10px] leading-snug text-ink sm:text-xs"
                            >
                              {briefTitle(post)}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedDate ? (
          <aside className="w-full shrink-0 lg:sticky lg:top-[calc(var(--app-header-height)+0.5rem)] lg:w-80 xl:w-96">
            <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
                <h2 className="text-sm font-semibold text-ink">
                  {dayPanelLabel(selectedDate)}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedDate(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink"
                  aria-label="패널 닫기"
                >
                  ×
                </button>
              </div>
              {selectedPosts.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  이 날짜의 기록이 없습니다.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {selectedPosts.map((post) => {
                    const thumb = post.imageUrls[0];
                    return (
                      <li key={post.id}>
                        <button
                          type="button"
                          onClick={() => setDetailPost(post)}
                          className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-accent-soft/50"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-md border border-line object-cover"
                            />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">
                              {postDisplayTitle(post)}
                            </p>
                            {post.bibleRef ? (
                              <p className="mt-0.5 truncate text-xs text-muted">
                                {post.bibleRef}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-muted">
                              {formatPostDateTime(post.createdAt)}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        onCommentAdded={() => void 0}
      />
    </div>
  );
}
