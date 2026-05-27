import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupManageClient } from "@/components/group/group-manage-client";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `소그룹 관리 — ${id}` };
}

export default async function GroupManageInContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/manage`)}`);
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-1 pb-12 pt-1 sm:px-2">
      <h1 className="mb-4 font-display text-base text-ink">소그룹 관리</h1>
      <GroupManageClient defaultGroupId={id} />
    </div>
  );
}
