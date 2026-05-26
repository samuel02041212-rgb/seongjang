"use client";

import { createPortal } from "react-dom";

import { GroupPicker } from "@/components/group/group-picker";
import { useGroupPanel } from "@/components/group/group-panel";

export function GroupPickerOverlay() {
  const { groupOpen, closeGroup, joinedGroups, groupsLoaded, activeGroup } =
    useGroupPanel();

  if (!groupOpen) return null;

  const hasGroups = joinedGroups.length > 0;

  return createPortal(
    <>
      <div
        className="fixed inset-0 top-[var(--app-header-height)] z-[45] bg-ink/45 lg:pl-16"
        aria-hidden
        onClick={() => closeGroup()}
      />
      <div className="pointer-events-none fixed inset-0 top-[var(--app-header-height)] z-[46] flex items-center justify-center px-4 lg:pl-16">
        <div
          className="pointer-events-auto text-center"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={hasGroups ? "소그룹 선택" : "소그룹 가입 안내"}
        >
          {!groupsLoaded ? (
            <p className="text-sm text-muted">불러오는 중…</p>
          ) : hasGroups ? (
            <GroupPicker groups={joinedGroups} showGrowthHome={!!activeGroup} />
          ) : (
            <p className="text-sm font-medium text-ink">소그룹에 가입해주세요</p>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
