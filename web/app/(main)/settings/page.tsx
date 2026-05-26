import type { Metadata } from "next";

import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "설정 — 성경나눔장소",
};

export default function SettingsPage() {
  return (
    <SubPageLayout title="설정">
      <SettingsPageContent />
    </SubPageLayout>
  );
}
