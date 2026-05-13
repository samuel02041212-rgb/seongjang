"use client";

import { ChatProvider } from "@/components/chat/chat-dock";
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
};

export function MainNavShell({
  children,
  joinedGroups,
  userName,
  userImage,
  isAuthenticated,
  isAdmin,
}: MainNavShellProps) {
  return (
    <ChatProvider>
      <SnsFeedLayout
        joinedGroups={joinedGroups}
        userName={userName}
        userImage={userImage}
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
      >
        {children}
      </SnsFeedLayout>
    </ChatProvider>
  );
}
