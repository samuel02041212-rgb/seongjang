import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/server-auth";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "회원가입 — 성장",
  description: "성경나눔장소 회원가입",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) {
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
      <RegisterForm />
    </div>
  );
}
