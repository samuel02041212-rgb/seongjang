export type UserTodoJson = {
  id: string;
  date: string;
  text: string;
  done: boolean;
};

export const TODOS_UPDATED_EVENT = "user-todos-updated";

export function notifyTodosUpdated() {
  window.dispatchEvent(new Event(TODOS_UPDATED_EVENT));
}

export function formatTodoDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  });
}

export function todoDdayLabel(todoDate: string, todayIso: string): string {
  const today = new Date(`${todayIso}T12:00:00+09:00`).getTime();
  const target = new Date(`${todoDate}T12:00:00+09:00`).getTime();
  const diff = Math.round((target - today) / 86_400_000);
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

export type DayTodoStatus = "none" | "pending" | "allDone";

export function dayTodoStatus(todos: UserTodoJson[]): DayTodoStatus {
  if (todos.length === 0) return "none";
  if (todos.every((t) => t.done)) return "allDone";
  return "pending";
}
