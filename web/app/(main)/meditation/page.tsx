import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { auth } from "@/lib/server-auth";

import { MeditationPageClient } from "./meditation-page-client";

export const metadata: Metadata = {
  title: "말씀묵상 — 성경나눔장소",
  description: "묵상 글·성경 뷰어",
};

export default async function MeditationPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/meditation")}`);
  }

  return (
    <SubPageLayout title="말씀묵상" wide>
      <MeditationPageClient />
    </SubPageLayout>
  );
}
