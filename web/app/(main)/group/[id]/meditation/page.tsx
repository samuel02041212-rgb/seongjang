import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MeditationPageClient } from "@/app/(main)/meditation/meditation-page-client";
import { auth } from "@/lib/server-auth";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `말씀묵상 — ${id}` };
}

export default async function GroupMeditationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/group/${id}/meditation`)}`);
  }
  return (
    <div className="mx-auto w-full pb-12">
      <MeditationPageClient groupId={id} />
    </div>
  );
}
