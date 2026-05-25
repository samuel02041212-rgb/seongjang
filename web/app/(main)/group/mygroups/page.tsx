import type { Metadata } from "next";

import { GroupMygroupsView } from "@/components/group/group-mygroups-view";

export const metadata: Metadata = {
  title: "소그룹 — 성경나눔장소",
};

export default function GroupMygroupsPage() {
  return <GroupMygroupsView />;
}
