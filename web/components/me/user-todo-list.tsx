"use client";

import { useState } from "react";

import { feedTodayIso } from "@/lib/feed-date";
import { formatTodoDateLabel, todoDdayLabel, type UserTodoJson } from "@/lib/user-todo";

type UserTodoListProps = {
  todos: UserTodoJson[];
  editable?: boolean;
  showDate?: boolean;
  showDday?: boolean;
  todayIso?: string;
  loading?: boolean;
  emptyMessage?: string;
  onToggle: (id: string, done: boolean) => void;
};

export function UserTodoAddForm({
  onAdd,
  pending = false,
  showDatePicker = false,
  defaultDate,
}: {
  onAdd: (text: string, date: string) => void;
  pending?: boolean;
  showDatePicker?: boolean;
  defaultDate?: string;
}) {
  const [newTodo, setNewTodo] = useState("");
  const [date, setDate] = useState(defaultDate ?? feedTodayIso());

  const submit = () => {
    const text = newTodo.trim();
    if (!text || pending) return;
    onAdd(text, date);
    setNewTodo("");
  };

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-line px-3 py-2">
      {showDatePicker ? (
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={pending}
          className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
        />
      ) : null}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="할 일 추가"
          disabled={pending}
          className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !newTodo.trim()}
          className="shrink-0 rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-accent-soft disabled:opacity-50"
        >
          추가
        </button>
      </div>
    </div>
  );
}

export function UserTodoList({
  todos,
  editable = false,
  showDate = false,
  showDday = false,
  todayIso = feedTodayIso(),
  loading = false,
  emptyMessage = "등록된 할 일이 없습니다.",
  onToggle,
}: UserTodoListProps) {
  if (loading) {
    return <p className="px-4 py-3 text-xs text-muted">불러오는 중…</p>;
  }

  return (
    <>
      {todos.length > 0 ? (
        <ul className="divide-y divide-line">
          {todos.map((item) => (
            <li key={item.id} className="flex items-start gap-2 px-4 py-2.5">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => onToggle(item.id, !item.done)}
                disabled={!editable}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-accent disabled:opacity-70"
              />
              <div className="min-w-0 flex-1">
                {showDday ? (
                  <p className="text-[10px] font-medium text-accent">
                    {todoDdayLabel(item.date, todayIso)}
                  </p>
                ) : showDate ? (
                  <p className="text-[10px] text-muted">
                    {formatTodoDateLabel(item.date)}
                  </p>
                ) : null}
                <span
                  className={`text-sm ${
                    item.done ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {item.text}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-xs text-muted">{emptyMessage}</p>
      )}
    </>
  );
}
