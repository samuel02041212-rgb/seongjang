import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/server-auth";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "로그인 — 성장",
  description: "성경나눔장소 로그인",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const nextPath = safeCallbackUrl(sp?.callbackUrl, "/feed");

  if (session?.user?.id) {
    redirect(nextPath);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link
        href="/"
        className="mb-8 text-sm font-medium text-muted hover:text-ink"
      >
        ← 처음으로
      </Link>
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        <LoginForm showRegisteredNotice={sp?.registered === "1"} />
      </Suspense>
    </div>
  );
}
