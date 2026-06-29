"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GroupCreateModal } from "@/components/group/group-create-modal";
import { GroupJoinModal } from "@/components/group/group-join-modal";
import { useGroupPanel } from "@/components/group/group-panel";

type GroupNavActionsProps = {
  className?: string;
};

export function GroupNavActions({ className }: GroupNavActionsProps) {
  const { refreshPicker, groupOpen, joinedGroups, groupsLoaded } =
    useGroupPanel();
  const [menuOpen, setMenuOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (groupOpen && groupsLoaded && joinedGroups.length === 0) {
      setMenuOpen(true);
      return;
    }
    if (!groupOpen) setMenuOpen(false);
  }, [groupOpen, groupsLoaded, joinedGroups.length]);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent | TouchEvent) {
      const el = menuRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <div className={`relative ${className ?? ""}`} ref={menuRef}>
        <button
          type="button"
          data-tour="group-plus"
          onClick={() => setMenuOpen((v) => !v)}
          className={`relative flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-accent-soft hover:text-accent-foreground focus:outline-none ${
            menuOpen ? "bg-accent-soft text-accent-foreground" : ""
          }`}
          aria-label="소그룹 추가"
          aria-expanded={menuOpen}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        {menuOpen ? (
          <div className="absolute left-full top-1/2 z-[60] ml-2 w-36 -translate-y-[calc(50%+15px)] overflow-hidden rounded-lg border border-line bg-surface py-0.5 shadow-lg">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft"
              onClick={() => {
                closeMenu();
                setJoinOpen(true);
              }}
            >
              소그룹 가입하기
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft"
              onClick={() => {
                closeMenu();
                setCreateOpen(true);
              }}
            >
              소그룹 만들기
            </button>
          </div>
        ) : null}
      </div>

      <GroupJoinModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={refreshPicker}
      />
      <GroupCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
