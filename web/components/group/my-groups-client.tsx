"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProfileAvatar } from "@/components/me/profile-avatar";
import type { GroupJson } from "@/lib/group";

export function MyGroupsClient() {
  const [groups, setGroups] = useState<GroupJson[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/mine", { credentials: "include" });
      if (!res.ok) {
        setGroups([]);
        return;
      }
      setGroups((await res.json()) as GroupJson[]);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-muted">불러오는 중…</p>;
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface px-6 py-16 text-center text-sm text-muted">
        <p>가입한 소그룹이 없습니다.</p>
        <p className="mt-2 text-xs">
          왼쪽 아래 <strong className="text-ink">+</strong>에서 가입하거나
          만들 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {groups.map((g) => (
        <li key={g.id}>
          <Link
            href={`/group/${g.id}`}
            className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-sm transition hover:border-accent"
          >
            {g.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={g.image}
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <ProfileAvatar image={null} className="h-12 w-12" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{g.name}</p>
              {g.statusMessage ? (
                <p className="truncate text-xs text-muted">{g.statusMessage}</p>
              ) : null}
            </div>
            {g.isAdmin ? (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                관리자
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
