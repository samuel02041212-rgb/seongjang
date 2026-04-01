import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { auth } from "@/lib/server-auth";

export const metadata: Metadata = {
  title: "관리자 — 성경나눔장소",
  description: "사용자·게시글·일정·소그룹 요청 관리",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fadmin");
  }
  if (!session.user.isAdmin) {
    redirect("/feed");
  }
  return <AdminDashboard />;
}
