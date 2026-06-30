import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/server-auth";
import { isProfileComplete } from "@/lib/user-profile";
import { prisma } from "@/lib/prisma";

import { RegisterForm } from "../register-form";

export const metadata: Metadata = {
  title: "카카오 회원가입 — 성장",
  description: "카카오 로그인 후 추가 정보 입력",
};

export default async function KakaoRegisterPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, gender: true, birthDate: true, church: true, registrationApproved: true },
  });
  if (!user) redirect("/login");

  if (isProfileComplete(user)) {
    redirect(user.registrationApproved ? "/feed" : "/register/pending");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link
        href="/login"
        className="mb-8 text-sm font-medium text-muted hover:text-ink"
      >
        ← 로그인
      </Link>
      <RegisterForm mode="kakao" initialName={user.name?.trim() ?? ""} />
    </div>
  );
}
