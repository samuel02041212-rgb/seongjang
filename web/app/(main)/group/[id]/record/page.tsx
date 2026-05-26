import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RecordPageClient } from "@/components/record/record-page-client";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `말씀 기록 — ${id}` };
}

export default async function GroupRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/record`)}`);
  }
  return (
    <div className="mx-auto w-full pb-12">
      <RecordPageClient groupId={id} />
    </div>
  );
}
