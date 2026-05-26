import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FeedClient } from "@/app/(main)/feed/feed-client";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `소그룹 홈 — ${id}` };
}

export default async function GroupFeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/feed`)}`);
  }
  return <FeedClient groupId={id} />;
}
