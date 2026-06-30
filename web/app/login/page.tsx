import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/server-auth";
import { isKakaoAuthConfigured } from "@/lib/kakao-auth-env";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "로그인 — 성장",
  description: "성경나눔장소 로그인",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string;
    callbackUrl?: string;
    error?: string;
  }>;
}) {
  const session = await auth();
  const sp = await searchParams;
  const nextPath = safeCallbackUrl(sp?.callbackUrl, "/feed");
  const authError =
    sp?.error === "AccessDenied"
      ? "로그인 권한이 없습니다. 관리자 승인 후 다시 시도해 주세요."
      : sp?.error
        ? "로그인에 실패했습니다. 다시 시도해 주세요."
        : null;

  if (session?.user?.id) {
    if (!session.user.profileComplete) {
      redirect("/register/kakao");
    }
    if (!session.user.registrationApproved) {
      redirect("/register/pending");
    }
    redirect(nextPath);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--color-accent-soft),transparent)]"
        aria-hidden
      />
      <Link
        href="/"
        className="relative mb-8 text-sm font-medium text-muted transition hover:text-ink"
      >
        ← 처음으로
      </Link>
      <div className="relative">
        <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
          <LoginForm
            showRegisteredNotice={sp?.registered === "1"}
            authError={authError}
            kakaoConfigured={isKakaoAuthConfigured()}
          />
        </Suspense>
      </div>
    </div>
  );
}
