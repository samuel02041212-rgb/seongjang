import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";

import { UserProfileClient } from "./user-profile-client";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `프로필 — ${id}` };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <SubPageLayout title="프로필" mePage>
      <UserProfileClient userId={id} />
    </SubPageLayout>
  );
}
