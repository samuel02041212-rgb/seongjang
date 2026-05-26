"use client";

import { useEffect, useState } from "react";

import { GroupAvatar } from "@/components/group/group-avatar";
import type { GroupJson } from "@/lib/group-types";

type Props = {
  open: boolean;
  groups: GroupJson[];
  onClose: () => void;
  onConfirm: (groupIds: string[]) => void;
  pending?: boolean;
};

export function GroupPostShareModal({
  open,
  groups,
  onClose,
  onConfirm,
  pending = false,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-lg bg-surface shadow-xl sm:rounded-lg">
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">소그룹에도 공유</h2>
          <p className="mt-1 text-xs text-muted">
            메인 피드에는 항상 게시됩니다. 공유할 소그룹을 선택하세요.
          </p>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {groups.map((g) => {
            const on = selected.has(g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => toggle(g.id)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                    on ? "border-accent bg-accent-soft" : "border-line hover:bg-accent-soft/50"
                  }`}
                >
                  <GroupAvatar image={g.image} className="h-10 w-10" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {g.name}
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      on
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-line bg-bg"
                    }`}
                    aria-hidden
                  >
                    {on ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            취소
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onConfirm([...selected])}
            className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {pending ? "게시 중…" : "게시하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
