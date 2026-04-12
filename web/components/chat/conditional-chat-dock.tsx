"use client";

import { usePathname } from "next/navigation";

import { ChatDock } from "./chat-dock";

export function ConditionalChatDock() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ChatDock />;
}
