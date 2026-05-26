"use client";

import { ChatProvider } from "@/components/chat/chat-dock";
import { GroupProvider } from "@/components/group/group-panel";
import { SnsFeedLayout } from "@/components/feed/sns-feed-layout";

type MainNavShellProps = {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

export function MainNavShell({
  children,
  isAuthenticated,
  isAdmin,
}: MainNavShellProps) {
  return (
    <GroupProvider>
      <ChatProvider>
        <SnsFeedLayout
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
        >
          {children}
        </SnsFeedLayout>
      </ChatProvider>
    </GroupProvider>
  );
}
