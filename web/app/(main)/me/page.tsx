import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { MePageClient } from "./me-page-client";

export const metadata: Metadata = {
  title: "마이페이지 — 성경나눔장소",
  description: "프로필·내 게시글·일정",
};

export default function MePage() {
  return (
    <SubPageLayout title="마이페이지">
      <MePageClient />
    </SubPageLayout>
  );
}
