import type { Metadata } from "next";

import { GroupManageClient } from "@/components/group/group-manage-client";
import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "소그룹 관리 — 성경나눔장소",
};

export default function GroupManagePage() {
  return (
    <SubPageLayout title="소그룹 관리">
      <GroupManageClient />
    </SubPageLayout>
  );
}
