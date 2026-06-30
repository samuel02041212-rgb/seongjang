import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PendingNotice } from "./pending-notice";
import { auth } from "@/lib/server-auth";
import { isProfileComplete } from "@/lib/user-profile";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "승인 대기 — 성장",
  description: "관리자 승인 대기",
};

export default async function RegisterPendingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      gender: true,
      birthDate: true,
      church: true,
      registrationApproved: true,
    },
  });
  if (!user) redirect("/login");

  if (!isProfileComplete(user)) {
    redirect("/register/kakao");
  }

  if (user.registrationApproved) {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium text-muted hover:text-ink"
      >
        ← 처음으로
      </Link>
      <PendingNotice />
    </div>
  );
}
