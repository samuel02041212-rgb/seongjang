import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { auth } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "자료실 — 성경나눔장소",
};

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/resources")}`);
  }

  return (
    <SubPageLayout title="자료실">
      <div className="rounded-lg border border-line bg-surface px-6 py-16 text-center shadow-sm">
        <p className="text-sm text-muted">Coming soon</p>
      </div>
    </SubPageLayout>
  );
}
