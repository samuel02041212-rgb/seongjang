import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/server-auth";

import { FeedClient } from "./feed-client";

export const metadata: Metadata = {
  title: "피드 — 성경나눔장소",
  description: "나눔과 교제 피드",
};

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Ffeed");
  }
  return <FeedClient />;
}
