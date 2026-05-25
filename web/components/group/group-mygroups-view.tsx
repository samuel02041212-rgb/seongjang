"use client";

import { useEffect } from "react";

import { useGroupPanel } from "@/components/group/group-panel";

export function GroupMygroupsView() {
  const { joinedGroups, groupsLoaded, refreshPicker } = useGroupPanel();

  useEffect(() => {
    refreshPicker();
  }, [refreshPicker]);

  if (!groupsLoaded) return null;

  if (joinedGroups.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--app-header-height))] items-center justify-center bg-surface">
        <p className="text-sm text-muted">소그룹에 가입해주세요</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-var(--app-header-height))] items-center justify-center bg-surface">
      <p className="text-sm text-muted">왼쪽 소그룹 탭을 눌러 소그룹을 선택하세요.</p>
    </div>
  );
}
