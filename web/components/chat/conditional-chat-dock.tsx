"use client";

import { usePathname } from "next/navigation";

import { ChatDock } from "./chat-dock";

/** 랜딩(/) 제외 — 레거시는 로그인 후 페이지에만 chat.js 주입 */
export function ConditionalChatDock() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ChatDock />;
}
