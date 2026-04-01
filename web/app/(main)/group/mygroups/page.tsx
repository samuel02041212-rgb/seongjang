import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "소그룹 — 성경나눔장소",
};

export default function GroupMygroupsPage() {
  return (
    <SubPageLayout title="소그룹">
      <p className="mb-4 text-sm text-muted">
        가입한 소그룹이 여기에 표시됩니다. 기능 연동 전에는 목록이 비어 있을 수
        있습니다.
      </p>
      <div className="rounded-2xl border border-dashed border-line bg-surface/80 px-6 py-12 text-center text-sm text-muted">
        가입한 소그룹이 없습니다.
      </div>
    </SubPageLayout>
  );
}
