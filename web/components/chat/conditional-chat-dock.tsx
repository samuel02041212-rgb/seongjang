"use client";

import { useSession } from "next-auth/react";

import { ChatDock } from "./chat-dock";

export function ConditionalChatDock() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <ChatDock />;
}
