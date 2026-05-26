import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupRoomView } from "@/components/group/group-room-view";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `소그룹 채팅 — ${id}` };
}

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    const { id } = await params;
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/chat`)}`);
  }
  const { id } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <GroupRoomView groupId={id} />
    </div>
  );
}
