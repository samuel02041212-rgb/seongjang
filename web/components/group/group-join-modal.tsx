"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { GroupJson } from "@/lib/group";

type GroupJoinModalProps = {
  open: boolean;
  onClose: () => void;
  onJoined?: () => void;
};

export function GroupJoinModal({ open, onClose, onJoined }: GroupJoinModalProps) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<GroupJson[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const search = useCallback(async (query: string) => {
    try {
      const qs = query.trim()
        ? `?q=${encodeURIComponent(query.trim())}`
        : "";
      const res = await fetch(`/api/groups${qs}`, { credentials: "include" });
      if (!res.ok) {
        setHits([]);
        return;
      }
      setHits((await res.json()) as GroupJson[]);
    } catch {
      setHits([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setError("");
    void search("");
  }, [open, search]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => void search(q), 200);
    return () => clearTimeout(t);
  }, [open, q, search]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function requestJoin(groupId: string) {
    setError("");
    setPendingId(groupId);
    try {
      const res = await fetch("/api/groups/join-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const body = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !body.ok) {
        setError(body.message ?? "가입 요청에 실패했습니다.");
        return;
      }
      setHits((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, joinStatus: "pending" as const } : g,
        ),
      );
      onJoined?.();
    } catch {
      setError("네트워크 오류입니다.");
    } finally {
      setPendingId(null);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-lg bg-surface shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">소그룹 가입하기</h2>
          <button
            type="button"
            className="text-xl text-muted hover:text-ink"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="소그룹 이름 검색"
            className="w-full rounded-md border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
          />
          {error ? (
            <p className="mt-2 text-sm text-red-800">{error}</p>
          ) : null}
          <ul className="mt-3 space-y-1">
            {hits.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5"
              >
                {g.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.image}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    {g.name.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {g.name}
                  </p>
                  {g.statusMessage ? (
                    <p className="truncate text-xs text-muted">
                      {g.statusMessage}
                    </p>
                  ) : null}
                </div>
                {g.joinStatus === "member" ? (
                  <span className="text-xs text-muted">가입됨</span>
                ) : g.joinStatus === "pending" ? (
                  <span className="text-xs text-accent-foreground">대기 중</span>
                ) : (
                  <button
                    type="button"
                    disabled={pendingId === g.id}
                    onClick={() => void requestJoin(g.id)}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50"
                  >
                    {pendingId === g.id ? "요청 중…" : "가입하기"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {hits.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">
              검색 결과가 없습니다.
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
