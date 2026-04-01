"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type AdminTab = "manage" | "schedule" | "group";

type AdminUserRow = {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
  isApproved?: boolean;
  createdAt?: string;
};

type AdminPostRow = {
  _id: string;
  title?: string;
  content?: string;
  authorName?: string;
  bibleRef?: string;
  createdAt?: string;
};

type ScheduleEv = {
  _id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string;
};

function fmtDate(iso: string | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR");
  } catch {
    return "";
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function fmtYMD(d: Date) {
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function toLocalInputValue(d: Date) {
  const x = d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

function fmtHM(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("manage");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">
          관리자
          <Link
            href="/feed"
            className="ml-3 text-sm font-normal text-accent-foreground underline-offset-2 hover:underline"
          >
            피드로
          </Link>
        </h1>
        <p className="text-xs text-muted">
          레거시 관리자 탭과 동일: 관리 · 달력/일정 · 소그룹
        </p>
      </div>

      <div className="flex gap-1 border-b border-line pb-px">
        {(
          [
            ["manage", "관리"],
            ["schedule", "달력/일정"],
            ["group", "소그룹"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              tab === k
                ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                : "text-muted hover:bg-accent-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "manage" ? <AdminManagePanel /> : null}
        {tab === "schedule" ? <AdminSchedulePanel /> : null}
        {tab === "group" ? <AdminGroupPanel /> : null}
      </div>
    </div>
  );
}

function AdminManagePanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [pending, setPending] = useState<AdminUserRow[]>([]);
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [userQ, setUserQ] = useState("");
  const [postQ, setPostQ] = useState("");
  const [loadErr, setLoadErr] = useState("");

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { credentials: "include" });
    if (!res.ok) {
      setLoadErr("사용자 목록을 불러오지 못했습니다.");
      return;
    }
    setUsers(await res.json());
  }, []);

  const loadPending = useCallback(async () => {
    const res = await fetch("/api/admin/pending-users", { credentials: "include" });
    if (!res.ok) return;
    setPending(await res.json());
  }, []);

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/admin/posts", { credentials: "include" });
    if (!res.ok) {
      setLoadErr("게시글 목록을 불러오지 못했습니다.");
      return;
    }
    setPosts(await res.json());
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadPending();
    void loadPosts();
  }, [loadUsers, loadPending, loadPosts]);

  const filteredUsers = useMemo(() => {
    const q = userQ.trim().toLowerCase();
    return users.filter((u) => {
      const a = (u.username ?? "").toLowerCase();
      const b = (u.email ?? "").toLowerCase();
      return !q || a.includes(q) || b.includes(q);
    });
  }, [users, userQ]);

  const filteredPosts = useMemo(() => {
    const q = postQ.trim().toLowerCase();
    return posts.filter((p) => {
      const a = (p.authorName ?? "").toLowerCase();
      const b = (p.title ?? "").toLowerCase();
      const c = (p.content ?? "").toLowerCase();
      return !q || a.includes(q) || b.includes(q) || c.includes(q);
    });
  }, [posts, postQ]);

  async function approveUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}/approve`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      alert("승인 실패");
      return;
    }
    await loadPending();
    await loadUsers();
  }

  async function rejectUser(id: string) {
    if (!confirm("정말 거절(삭제)할까요?")) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("거절 실패");
      return;
    }
    await loadPending();
    await loadUsers();
  }

  async function deletePost(id: string) {
    if (!confirm("게시글을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    await loadPosts();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {loadErr ? (
        <p className="lg:col-span-3 text-sm text-red-700">{loadErr}</p>
      ) : null}

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">사용자</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={userQ}
            onChange={(e) => setUserQ(e.target.value)}
            placeholder="이름/이메일 검색"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="shrink-0 rounded-xl border border-line bg-bg px-3 py-2 text-xs font-medium"
          >
            새로고침
          </button>
        </div>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {filteredUsers.length === 0 ? (
            <li className="text-muted">사용자가 없습니다.</li>
          ) : (
            filteredUsers.map((u) => (
              <li
                key={u._id}
                className="flex gap-2 rounded-xl border border-line/80 bg-bg/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink">
                    {u.username ?? ""}{" "}
                    {u.role ? (
                      <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs">
                        {u.role}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted">{u.email}</div>
                  <div className="text-xs text-muted">
                    승인: {u.isApproved ? "예" : "대기"} · 가입:{" "}
                    {fmtDate(u.createdAt)}
                  </div>
                </div>
                {!u.isApproved ? (
                  <button
                    type="button"
                    onClick={() => void approveUser(u._id)}
                    className="shrink-0 self-start rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
                  >
                    승인
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">게시글</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={postQ}
            onChange={(e) => setPostQ(e.target.value)}
            placeholder="작성자/제목/내용 검색"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadPosts()}
            className="shrink-0 rounded-xl border border-line bg-bg px-3 py-2 text-xs font-medium"
          >
            새로고침
          </button>
        </div>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {filteredPosts.length === 0 ? (
            <li className="text-muted">게시글이 없습니다.</li>
          ) : (
            filteredPosts.map((p) => (
              <li
                key={p._id}
                className="rounded-xl border border-line/80 bg-bg/50 p-3"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-ink">
                    {p.title || "(제목 없음)"}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {fmtDate(p.createdAt)}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  작성자: {p.authorName}
                </div>
                {p.bibleRef ? (
                  <div className="text-xs text-muted">📖 {p.bibleRef}</div>
                ) : null}
                <pre className="mt-2 max-h-24 overflow-hidden text-xs whitespace-pre-wrap text-ink/90">
                  {(p.content ?? "").slice(0, 200)}
                  {(p.content ?? "").length > 200 ? "…" : ""}
                </pre>
                <button
                  type="button"
                  onClick={() => void deletePost(p._id)}
                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                >
                  삭제
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">회원가입 요청</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-medium">
            {pending.length}명
          </span>
          <button
            type="button"
            onClick={() => void loadPending()}
            className="rounded-xl border border-line bg-bg px-3 py-2 text-xs font-medium"
          >
            새로고침
          </button>
        </div>
        <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
          {pending.length === 0 ? (
            <li className="text-muted">승인 대기 사용자가 없습니다.</li>
          ) : (
            pending.map((u) => (
              <li
                key={u._id}
                className="flex gap-2 rounded-xl border border-line/80 bg-bg/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{u.username}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                  <div className="text-xs text-muted">
                    요청: {fmtDate(u.createdAt)}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => void approveUser(u._id)}
                    className="rounded-lg bg-accent px-2 py-1 text-xs text-accent-foreground"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => void rejectUser(u._id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                  >
                    거절
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function AdminGroupPanel() {
  const [list, setList] = useState<{ _id: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/group-creation-requests", {
      credentials: "include",
    });
    if (res.ok) setList(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-ink">소그룹 개설 요청</h2>
      <div className="mt-2 flex gap-2">
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs">
          {list.length}건
        </span>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-line bg-bg px-3 py-2 text-xs"
        >
          새로고침
        </button>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted">불러오는 중…</p>
      ) : list.length === 0 ? (
        <div className="mt-4 space-y-2 text-sm text-muted">
          <p>대기 중인 요청이 없습니다.</p>
          <p className="text-xs">
            (레거시 Mongo `GroupCreationRequest`는 아직 Prisma에 없습니다. 모델
            추가 후 승인·거절 API를 연결할 수 있습니다.)
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {list.map((r) => (
            <li key={r._id} className="rounded-xl border border-line p-3">
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminSchedulePanel() {
  const dow = ["일", "월", "화", "수", "목", "금", "토"];
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState<ScheduleEv[]>([]);
  const [modal, setModal] = useState<
    | { mode: "new" }
    | { mode: "edit"; ev: ScheduleEv }
    | null
  >(null);
  const [form, setForm] = useState({
    id: "",
    title: "",
    description: "",
    color: "#ffcd38",
    allDay: false,
    start: "",
    end: "",
  });

  const reload = useCallback(async () => {
    const first = new Date(viewMonth);
    const start = startOfDay(new Date(first.getFullYear(), first.getMonth(), 1));
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = endOfDay(
      new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + 42,
      ),
    );
    const qs = new URLSearchParams({
      from: gridStart.toISOString(),
      to: gridEnd.toISOString(),
    });
    const res = await fetch(`/api/admin/schedule?${qs}`, {
      credentials: "include",
    });
    setEvents(res.ok ? await res.json() : []);
  }, [viewMonth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function eventsForDay(d: Date) {
    const from = startOfDay(d).getTime();
    const to = endOfDay(d).getTime();
    return events.filter((ev) => {
      const s = new Date(ev.startAt).getTime();
      const e = new Date(ev.endAt).getTime();
      return s <= to && e >= from;
    });
  }

  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const first = new Date(y, m, 1);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const dayList = eventsForDay(selected).sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  function openNew() {
    const baseEnd = new Date(selected.getTime() + 60 * 60 * 1000);
    setForm({
      id: "",
      title: "",
      description: "",
      color: "#ffcd38",
      allDay: false,
      start: toLocalInputValue(selected),
      end: toLocalInputValue(baseEnd),
    });
    setModal({ mode: "new" });
  }

  function openEdit(ev: ScheduleEv) {
    setForm({
      id: ev._id,
      title: ev.title,
      description: ev.description,
      color: ev.color || "#ffcd38",
      allDay: ev.allDay,
      start: toLocalInputValue(new Date(ev.startAt)),
      end: toLocalInputValue(new Date(ev.endAt)),
    });
    setModal({ mode: "edit", ev });
  }

  async function saveModal() {
    const title = form.title.trim();
    const s = form.start ? new Date(form.start) : null;
    const e = form.end ? new Date(form.end) : null;
    if (!title || !s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e.getTime() < s.getTime()) {
      alert("제목/시작/끝을 확인해 주세요.");
      return;
    }
    const payload = {
      title,
      description: form.description.trim(),
      startAt: s.toISOString(),
      endAt: e.toISOString(),
      allDay: form.allDay,
      color: form.color || "#ffcd38",
    };
    const id = form.id.trim();
    const url = id
      ? `/api/admin/schedule/${encodeURIComponent(id)}`
      : "/api/admin/schedule";
    const res = await fetch(url, {
      method: id ? "PUT" : "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { ...payload } : payload),
    });
    if (!res.ok) {
      alert("저장 실패");
      return;
    }
    setModal(null);
    await reload();
  }

  async function deleteModal() {
    const id = form.id.trim();
    if (!id) return;
    if (!confirm("이 일정을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/schedule/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      alert("삭제 실패");
      return;
    }
    setModal(null);
    await reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-sm"
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
              )
            }
          >
            ‹
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium">
            {y}.{pad(m + 1)}
          </span>
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1 text-sm"
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
              )
            }
          >
            ›
          </button>
          <div className="flex-1" />
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1 text-xs"
            onClick={() => {
              const t = startOfDay(new Date());
              setSelected(t);
              setViewMonth(new Date(t.getFullYear(), t.getMonth(), 1));
            }}
          >
            오늘
          </button>
          <button
            type="button"
            className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
            onClick={openNew}
          >
            일정 추가
          </button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
          {dow.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const inMonth = d.getMonth() === m;
            const isSel = fmtYMD(d) === fmtYMD(selected);
            const evs = eventsForDay(d);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelected(startOfDay(d))}
                className={`flex min-h-[4rem] flex-col rounded-lg border p-1 text-left text-xs transition ${
                  inMonth ? "border-line bg-bg" : "border-transparent bg-bg/40 text-muted"
                } ${isSel ? "ring-2 ring-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={inMonth ? "font-semibold text-ink" : ""}>
                    {d.getDate()}
                  </span>
                  {evs.length > 0 ? (
                    <span className="rounded-full bg-accent-soft px-1 text-[10px]">
                      {evs.length}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {evs.slice(0, 6).map((ev) => (
                    <span
                      key={ev._id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: ev.color || "#bbb" }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface shadow-sm">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">
          선택한 날짜 일정 · {fmtYMD(selected)} ({dayList.length}개)
        </h2>
        <div className="max-h-[360px] overflow-y-auto p-3">
          {dayList.length === 0 ? (
            <p className="text-sm text-muted">일정이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {dayList.map((ev) => {
                const timeLabel = ev.allDay
                  ? "하루 종일"
                  : `${fmtHM(ev.startAt)} ~ ${fmtHM(ev.endAt)}`;
                return (
                  <li
                    key={ev._id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-line/80 bg-bg/50 p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: ev.color || "#bbb" }}
                        />
                        <span className="font-medium text-ink">
                          {ev.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        {timeLabel}
                        {ev.description
                          ? ` · ${ev.description.slice(0, 80)}${ev.description.length > 80 ? "…" : ""}`
                          : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(ev)}
                      className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs"
                    >
                      수정
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p className="border-t border-line px-4 py-2 text-xs text-muted">
          * 여기서 등록한 일정은 모든 승인된 사용자에게 보이도록 연결할 수 있습니다.
          (사용자 캘린더 UI는 추후 `/me` 등에 연동)
        </p>
      </section>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-xl">
            <h3 className="text-base font-semibold">공용 일정</h3>
            <label className="mt-3 block text-xs font-medium text-muted">
              제목
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm"
            />
            <label className="mt-3 block text-xs font-medium text-muted">
              색상
            </label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="mt-1 h-10 w-full rounded-xl border border-line"
            />
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) =>
                  setForm((f) => ({ ...f, allDay: e.target.checked }))
                }
              />
              하루 종일
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted">시작</label>
                <input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted">끝</label>
                <input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, end: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-line bg-bg px-2 py-2 text-sm"
                />
              </div>
            </div>
            <label className="mt-2 block text-xs text-muted">메모</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-between gap-2">
              {modal.mode === "edit" ? (
                <button
                  type="button"
                  onClick={() => void deleteModal()}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  삭제
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-xl border border-line px-3 py-2 text-sm"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => void saveModal()}
                  className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
