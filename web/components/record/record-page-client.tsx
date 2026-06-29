"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useUserTodos } from "@/components/me/use-user-todos";
import { UserTodoAddForm, UserTodoList } from "@/components/me/user-todo-list";
import { PostDetailModal } from "@/components/feed/post-detail-modal";
import { mePageRecordPanelWidthClass } from "@/lib/feed-card-layout";
import { type UserTodoJson } from "@/lib/user-todo";
import { FEED_TZ, feedTodayIso, postFeedDateIso } from "@/lib/feed-date";
import {
  isKrPublicHoliday,
  recordCalendarDayColorClass,
  recordCalendarWeekdayColorClass,
} from "@/lib/kr-public-holidays";
import type { FeedPostJson } from "@/lib/feed-serialize";
import { postDisplayTitle } from "@/lib/group-post-msg";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const CALENDAR_POST_PREVIEW_LIMIT = 3;
const CALENDAR_TODO_PREVIEW_LIMIT = 2;

function postFeedDate(createdAt: string): string {
  return postFeedDateIso(createdAt);
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

function briefTodo(text: string): string {
  return text.length > 14 ? `${text.slice(0, 14)}…` : text;
}

function briefAuthorName(name: string): string {
  const label = name.trim() || "회원";
  return label.length > 6 ? `${label.slice(0, 6)}…` : label;
}

function calendarPostLabel(post: FeedPostJson, showAuthor: boolean): string {
  const title = briefTitle(post);
  if (!showAuthor) return title;
  return `${briefAuthorName(post.authorName)} · ${title}`;
}

function RecordDayPanel({
  selectedDate,
  posts,
  todos,
  todosEditable = false,
  todosLoading = false,
  todoPending = false,
  onToggleTodo,
  onAddTodo,
  onClose,
  onSelectPost,
  showPostAuthor = false,
  showTodos = false,
  className = "",
}: {
  selectedDate: string;
  posts: FeedPostJson[];
  todos?: UserTodoJson[];
  todosEditable?: boolean;
  todosLoading?: boolean;
  todoPending?: boolean;
  onToggleTodo?: (id: string, done: boolean) => void;
  onAddTodo?: (text: string) => void;
  onClose: () => void;
  onSelectPost: (post: FeedPostJson) => void;
  showPostAuthor?: boolean;
  showTodos?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm ${className}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">
          {dayPanelLabel(selectedDate)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink"
          aria-label="패널 닫기"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {posts.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            올라온 게시글이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {posts.map((post) => {
              const thumb = post.imageUrls[0];
              return (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-accent-soft/50"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-md border border-line object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {showPostAuthor ? (
                        <p className="truncate text-xs text-muted">
                          {post.authorName.trim() || "회원"}
                        </p>
                      ) : null}
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
        {showTodos ? (
          <div className="border-t border-line">
            <p className="px-4 pb-1 pt-3 text-[11px] font-medium text-muted">
              할 일
            </p>
            <UserTodoList
              todos={todos ?? []}
              editable={todosEditable}
              loading={todosLoading}
              emptyMessage="등록된 할 일이 없습니다."
              onToggle={onToggleTodo ?? (() => {})}
            />
          </div>
        ) : null}
      </div>
      {showTodos && todosEditable && onAddTodo ? (
        <UserTodoAddForm
          onAdd={(text) => onAddTodo(text)}
          pending={todoPending}
        />
      ) : null}
    </div>
  );
}

export function RecordPageClient({
  postsUrl,
  embedded = false,
  todoUserId,
  todosEditable = false,
  showCalendarPosts = false,
  showPostAuthor = false,
  showTodos = Boolean(todoUserId),
}: {
  postsUrl: string;
  embedded?: boolean;
  todoUserId?: string;
  todosEditable?: boolean;
  showCalendarPosts?: boolean;
  showPostAuthor?: boolean;
  showTodos?: boolean;
}) {
  const today = feedTodayIso();
  const { todos, loading: todosLoading, pending: todoPending, addTodo, toggleTodo } =
    useUserTodos(showTodos ? (todoUserId ?? "") : "");
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
        const res = await fetch(postsUrl, { credentials: "include" });
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
  }, [postsUrl]);

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

  const todosByDate = useMemo(() => {
    if (!showTodos) return new Map<string, UserTodoJson[]>();
    const map = new Map<string, UserTodoJson[]>();
    for (const t of todos) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return map;
  }, [showTodos, todos]);

  const selectedTodos = selectedDate ? (todosByDate.get(selectedDate) ?? []) : [];

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

  const toggleDate = useCallback((iso: string) => {
    setSelectedDate((prev) => (prev === iso ? null : iso));
  }, []);

  const closeDayPanel = useCallback(() => setSelectedDate(null), []);

  const dayPanel = selectedDate ? (
    <RecordDayPanel
      selectedDate={selectedDate}
      posts={selectedPosts}
      showTodos={showTodos}
      todos={showTodos ? selectedTodos : undefined}
      todosEditable={showTodos && todosEditable}
      todosLoading={showTodos && todosLoading}
      todoPending={showTodos && todoPending}
      onToggleTodo={showTodos ? (id, done) => void toggleTodo(id, done) : undefined}
      onAddTodo={
        showTodos && todosEditable
          ? (text) => void addTodo(text, selectedDate)
          : undefined
      }
      onClose={closeDayPanel}
      onSelectPost={setDetailPost}
      showPostAuthor={showPostAuthor}
    />
  ) : null;

  return (
    <>
      <div
        className={
          embedded
            ? "px-4 pb-6 pt-4 sm:px-6"
            : `mx-auto w-full pb-12 ${selectedDate ? "max-w-6xl" : "max-w-3xl"}`
        }
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

      <div
        className={
          embedded
            ? "relative min-w-0"
            : "flex flex-col gap-4 lg:flex-row lg:items-stretch"
        }
      >
        <div className={embedded ? "min-w-0" : "min-w-0 flex-1"}>
          {loading ? (
            <p className="py-16 text-center text-sm text-muted">불러오는 중…</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
              <div className="grid grid-cols-7 border-b border-line bg-bg/80 text-center text-xs font-medium">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`py-2.5 ${recordCalendarWeekdayColorClass(i)}`}
                  >
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
                  const dayTodos = showTodos ? (todosByDate.get(cell.iso) ?? []) : [];
                  const previewPosts = showCalendarPosts
                    ? dayPosts.slice(0, CALENDAR_POST_PREVIEW_LIMIT)
                    : [];
                  const hiddenPostCount = showCalendarPosts
                    ? Math.max(0, dayPosts.length - previewPosts.length)
                    : 0;
                  const previewTodos = showTodos
                    ? dayTodos.slice(0, CALENDAR_TODO_PREVIEW_LIMIT)
                    : [];
                  const hiddenTodoCount = showTodos
                    ? Math.max(0, dayTodos.length - previewTodos.length)
                    : 0;
                  const isToday = cell.iso === today;
                  const isSelected = cell.iso === selectedDate;
                  const hasPosts = dayPosts.length > 0;
                  const hasTodos = showTodos && dayTodos.length > 0;
                  const hasPreview =
                    previewPosts.length > 0 ||
                    previewTodos.length > 0 ||
                    hiddenPostCount > 0 ||
                    hiddenTodoCount > 0;
                  const hasActivity = hasPosts || hasTodos;
                  const dayColor = recordCalendarDayColorClass(cell.iso);
                  const holiday = isKrPublicHoliday(cell.iso);
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => toggleDate(cell.iso)}
                      className={`flex min-h-[5.5rem] flex-col border-b border-r border-line/50 p-1.5 text-left transition hover:bg-accent-soft/50 sm:min-h-[6.25rem] sm:p-2 ${
                        hasActivity ? "bg-accent-soft/40" : "bg-surface"
                      } ${isToday ? "ring-1 ring-inset ring-accent/50" : ""} ${
                        isSelected ? "bg-accent-soft ring-2 ring-inset ring-accent" : ""
                      }`}
                    >
                      <span
                        className={`text-xs font-medium sm:text-sm ${
                          isToday && !holiday
                            ? "text-accent-foreground"
                            : dayColor
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasPreview ? (
                        <div className="pointer-events-none mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                          {previewPosts.map((post) => (
                            <span
                              key={post.id}
                              className="truncate text-[10px] leading-snug text-ink sm:text-xs"
                            >
                              {calendarPostLabel(post, showPostAuthor)}
                            </span>
                          ))}
                          {hiddenPostCount > 0 ? (
                            <span className="text-[10px] leading-snug text-muted sm:text-xs">
                              +{hiddenPostCount}건
                            </span>
                          ) : null}
                          {previewTodos.map((todo) => (
                            <span
                              key={todo.id}
                              className={`truncate text-[10px] leading-snug sm:text-xs ${
                                todo.done
                                  ? "text-muted line-through"
                                  : "text-ink/80"
                              }`}
                            >
                              {briefTodo(todo.text)}
                            </span>
                          ))}
                          {hiddenTodoCount > 0 ? (
                            <span className="text-[10px] leading-snug text-muted sm:text-xs">
                              +{hiddenTodoCount}건
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {embedded && selectedDate && dayPanel ? (
          <aside
            className={`absolute left-full top-0 z-10 ml-[5px] h-full ${mePageRecordPanelWidthClass}`}
            role="region"
            aria-label={dayPanelLabel(selectedDate)}
          >
            {dayPanel}
          </aside>
        ) : null}

        {!embedded && selectedDate && dayPanel ? (
          <aside className="w-full shrink-0 lg:w-80 lg:self-stretch xl:w-96">
            {dayPanel}
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
    </>
  );
}
