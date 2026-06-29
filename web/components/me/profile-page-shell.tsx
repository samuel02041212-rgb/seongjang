import type { ReactNode } from "react";

import {
  mePageShellMaxWidthClass,
  mePageSidePanelWidthClass,
} from "@/lib/feed-card-layout";

import { ProfileSidePanel } from "./profile-side-panel";

type ProfilePageShellProps = {
  children: ReactNode;
  userId: string;
  sidePanelEditable?: boolean;
};

export function ProfilePageShell({
  children,
  userId,
  sidePanelEditable = false,
}: ProfilePageShellProps) {
  return (
    <div className="flex w-full justify-center">
      <div className={`relative w-full ${mePageShellMaxWidthClass}`}>
        <aside
          className={`absolute right-full top-0 z-10 mr-[5px] ${mePageSidePanelWidthClass}`}
          role="complementary"
          aria-label="프로필 사이드 패널"
        >
          <ProfileSidePanel userId={userId} editable={sidePanelEditable} />
        </aside>
        {children}
      </div>
    </div>
  );
}
