import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { GroupRoomClient } from "./group-room-client";

const NAMES: Record<string, string> = {
  g1: "청년합동 A조",
  g2: "삼육대 은빛",
  g3: "지역교회 소그룹",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const name = NAMES[id] ?? `소그룹 ${id}`;
  return { title: `${name} — 성경나눔장소` };
}

export default async function GroupRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupName = NAMES[id] ?? `소그룹 (${id})`;

  return (
    <SubPageLayout title={groupName}>
      <GroupRoomClient groupId={id} />
    </SubPageLayout>
  );
}
