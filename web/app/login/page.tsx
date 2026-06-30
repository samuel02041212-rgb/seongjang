import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/server-auth";
import { isKakaoAuthConfigured } from "@/lib/kakao-auth-env";
import { loginAuthErrorMessage } from "@/lib/auth-login-error";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "로그인 — 성경나눔장소",
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
  const authError = loginAuthErrorMessage(sp?.error);

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
    <div className="relative flex min-h-dvh flex-col items-center justify-start overflow-hidden px-4 pt-[min(7rem,16vh)]">
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/login_background_img.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/20" aria-hidden />
      </div>
      <Link
        href="/"
        className="relative mb-6 text-sm font-medium text-white/90 drop-shadow-sm transition hover:text-white"
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
