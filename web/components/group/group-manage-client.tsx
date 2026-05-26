"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { GroupEditModal } from "@/components/group/group-edit-modal";
import { ProfileAvatar } from "@/components/me/profile-avatar";
import { groupPath } from "@/lib/group-route";
import type { GroupJson } from "@/lib/group-types";

type JoinReq = {
  id: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null; church: string };
};

export function GroupManageClient() {
  const [groups, setGroups] = useState<GroupJson[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [joinReqs, setJoinReqs] = useState<JoinReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const active = groups.find((g) => g.id === activeId) ?? groups[0] ?? null;

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/mine", { credentials: "include" });
      if (!res.ok) {
        setGroups([]);
        return;
      }
      const all = (await res.json()) as GroupJson[];
      const managed = all.filter((g) => g.isAdmin);
      setGroups(managed);
      setActiveId((id) => {
        if (id && managed.some((g) => g.id === id)) return id;
        return managed[0]?.id ?? null;
      });
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadJoinReqs = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/join-requests`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setJoinReqs([]);
        return;
      }
      setJoinReqs((await res.json()) as JoinReq[]);
    } catch {
      setJoinReqs([]);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (!active) {
      setJoinReqs([]);
      return;
    }
    void loadJoinReqs(active.id);
  }, [active, loadJoinReqs]);

  async function review(reqId: string, action: "approve" | "reject") {
    if (!active) return;
    const res = await fetch(
      `/api/groups/${encodeURIComponent(active.id)}/join-requests/${encodeURIComponent(reqId)}/${action}`,
      { method: "POST", credentials: "include" },
    );
    if (!res.ok) return;
    await loadJoinReqs(active.id);
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>;
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center text-sm text-muted">
        <p>관리 중인 소그룹이 없습니다.</p>
        <Link
          href="/group/mygroups"
          className="mt-4 inline-block text-sm font-medium text-accent-foreground hover:underline"
        >
          소그룹으로
        </Link>
      </div>
    );
  }

  return (
    <>
      {groups.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveId(g.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                g.id === active?.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      ) : null}

      {active ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="group relative"
            aria-label="소그룹 프로필 수정"
          >
            {active.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.image}
                alt=""
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <ProfileAvatar image={null} className="h-20 w-20" />
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/45 text-white opacity-0 transition group-hover:opacity-100">
              ✎
            </span>
          </button>
          <h2 className="mt-3 font-display text-lg text-ink">{active.name}</h2>
          {active.statusMessage ? (
            <p className="mt-1 text-sm text-muted">{active.statusMessage}</p>
          ) : null}
          <Link
            href={groupPath(active.id, "feed")}
            className="mt-3 text-xs font-medium text-accent-foreground hover:underline"
          >
            소그룹 홈 열기 →
          </Link>
        </div>
      ) : null}

      <section className="rounded-lg border border-line bg-surface shadow-sm">
        <h3 className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
          가입 요청
          {joinReqs.length > 0 ? (
            <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {joinReqs.length}
            </span>
          ) : null}
        </h3>
        <ul className="divide-y divide-line">
          {joinReqs.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted">
              대기 중인 가입 요청이 없습니다.
            </li>
          ) : (
            joinReqs.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <ProfileAvatar image={r.user.image} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.user.name}</p>
                  {r.user.church ? (
                    <p className="text-xs text-muted">{r.user.church}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void review(r.id, "approve")}
                    className="rounded-lg bg-accent px-2 py-1 text-xs text-accent-foreground"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => void review(r.id, "reject")}
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

      <GroupEditModal
        open={editOpen}
        group={active}
        onClose={() => setEditOpen(false)}
        onSaved={(g) => {
          setGroups((prev) => prev.map((x) => (x.id === g.id ? g : x)));
        }}
      />
    </>
  );
}
