import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RecordPageClient } from "@/components/record/record-page-client";
import { auth } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "말씀 기록 — 성경나눔장소",
};

export default async function RecordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/record")}`);
  }
  return <RecordPageClient />;
}
