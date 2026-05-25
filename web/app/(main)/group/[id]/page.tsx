import type { Metadata } from "next";

import { GroupRoomView } from "@/components/group/group-room-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `소그룹 — ${id}` };
}

export default async function GroupRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex min-h-[calc(100dvh-var(--app-header-height)-15px)] flex-col">
      <GroupRoomView groupId={id} />
    </div>
  );
}
