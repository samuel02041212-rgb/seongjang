"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { UserTodoAddForm, UserTodoList } from "@/components/me/user-todo-list";
import { useUserTodos } from "@/components/me/use-user-todos";
import type { UserReadingStatusJson } from "@/lib/bible-reading-progress";
import {
  mePageSidePanelListHeightClass,
  mePageSidePanelReadingMinHeightClass,
} from "@/lib/feed-card-layout";
import { feedTodayIso } from "@/lib/feed-date";

type ProfileSidePanelProps = {
  userId: string;
  editable?: boolean;
};

const sidePanelListCardClass = `flex ${mePageSidePanelListHeightClass} flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm`;
const sidePanelListScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-bg">
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ProfileSidePanel({
  userId,
  editable = false,
}: ProfileSidePanelProps) {
  const [status, setStatus] = useState<UserReadingStatusJson | null>(null);
  const [loading, setLoading] = useState(true);
  const { todos, loading: todosLoading, pending, addTodo, toggleTodo } =
    useUserTodos(userId);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(userId)}/reading-status`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setStatus(null);
        return;
      }
      setStatus((await res.json()) as UserReadingStatusJson);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const progress = status?.readingProgress;
  const recentMeditations = status?.recentMeditations ?? [];
  const lastMeditation = progress?.lastMeditation;
  const today = feedTodayIso();
  const pendingTodos = useMemo(
    () =>
      todos
        .filter((t) => !t.done)
        .sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text)),
    [todos],
  );

  return (
    <div className="flex flex-col gap-3">
      <section
        className={`overflow-hidden rounded-lg border border-line bg-surface shadow-sm ${mePageSidePanelReadingMinHeightClass}`}
      >
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">통독 현황</h2>
        </div>
        <div className="space-y-3 px-4 py-3">
          {loading ? (
            <p className="text-xs text-muted">불러오는 중…</p>
          ) : (
            <>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">전체</span>
                  <span className="font-medium text-ink">
                    {progress?.totalPercent ?? 0}%
                  </span>
                </div>
                <ProgressBar value={progress?.totalPercent ?? 0} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-muted">구약</span>
                    <span className="text-ink">
                      {progress?.oldTestamentPercent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={progress?.oldTestamentPercent ?? 0} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-muted">신약</span>
                    <span className="text-ink">
                      {progress?.newTestamentPercent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={progress?.newTestamentPercent ?? 0} />
                </div>
              </div>
              <div className="border-t border-line/70 pt-3">
                <p className="text-[11px] text-muted">마지막 말씀묵상</p>
                {lastMeditation ? (
                  <>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {lastMeditation.range}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {lastMeditation.date}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted">기록 없음</p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className={sidePanelListCardClass}>
        <div className="shrink-0 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">할 일</h2>
        </div>
        <div className={sidePanelListScrollClass}>
          <UserTodoList
            todos={pendingTodos}
            editable={editable}
            showDday
            todayIso={today}
            loading={todosLoading}
            emptyMessage="남은 할 일이 없습니다."
            onToggle={(id, done) => void toggleTodo(id, done)}
          />
        </div>
        {editable ? (
          <UserTodoAddForm
            showDatePicker
            defaultDate={today}
            onAdd={(text, date) => void addTodo(text, date)}
            pending={pending}
          />
        ) : null}
      </section>

      <section className={sidePanelListCardClass}>
        <div className="shrink-0 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">최근 말씀묵상</h2>
        </div>
        <div className={sidePanelListScrollClass}>
          {loading ? (
            <p className="px-4 py-3 text-xs text-muted">불러오는 중…</p>
          ) : recentMeditations.length > 0 ? (
            <ul className="divide-y divide-line">
              {recentMeditations.map((item, index) => (
                <li key={`${item.date}-${item.range}-${index}`} className="px-4 py-2.5">
                  <p className="text-sm font-medium text-ink">{item.range}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-xs text-muted">
              기록된 말씀묵상이 없습니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
