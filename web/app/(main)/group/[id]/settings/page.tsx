import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `설정 — ${id}` };
}

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/settings`)}`);
  }
  return (
    <SubPageLayout title="설정">
      <SettingsPageContent />
    </SubPageLayout>
  );
}
