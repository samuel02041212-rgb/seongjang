"use client";

import { ChatProvider } from "@/components/chat/chat-dock";
import { GroupProvider } from "@/components/group/group-panel";
import {
  type JoinedGroup,
  SnsFeedLayout,
} from "@/components/feed/sns-feed-layout";

type MainNavShellProps = {
  children: React.ReactNode;
  joinedGroups: JoinedGroup[];
  userName: string;
  userImage: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGroupAdmin: boolean;
};

export function MainNavShell({
  children,
  joinedGroups,
  userName,
  userImage,
  isAuthenticated,
  isAdmin,
  isGroupAdmin,
}: MainNavShellProps) {
  return (
    <GroupProvider>
      <ChatProvider>
        <SnsFeedLayout
          joinedGroups={joinedGroups}
          userName={userName}
          userImage={userImage}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          isGroupAdmin={isGroupAdmin}
        >
          {children}
        </SnsFeedLayout>
      </ChatProvider>
    </GroupProvider>
  );
}
