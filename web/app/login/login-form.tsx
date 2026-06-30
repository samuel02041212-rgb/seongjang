"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { safeCallbackUrl } from "@/lib/safe-callback-url";

function KakaoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.848-1.995-4.785-5.078-4.785-8.866C1.5 6.665 6.201 3 12 3z" />
    </svg>
  );
}

export function LoginForm({
  showRegisteredNotice,
  authError,
  kakaoConfigured = true,
}: {
  showRegisteredNotice?: boolean;
  authError?: string | null;
  kakaoConfigured?: boolean;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"), "/feed");
  const [kakaoPending, setKakaoPending] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [clientError, setClientError] = useState("");

  async function onKakaoLogin() {
    if (!kakaoConfigured) return;
    setKakaoPending(true);
    try {
      const res = await signIn("kakao", { callbackUrl, redirect: false });
      if (res?.error) {
        setClientError(
          res.error === "Configuration"
            ? "로그인 설정 오류입니다. 서버 환경 변수를 확인해 주세요."
            : "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        setKakaoPending(false);
        return;
      }
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      setClientError("카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      setKakaoPending(false);
    } catch {
      setClientError("카카오 로그인을 시작하지 못했습니다.");
      setKakaoPending(false);
    }
  }

  return (
    <div className="flex aspect-square w-[min(100vw-2rem,20rem)] flex-col items-center justify-center overflow-hidden rounded-2xl border border-line/80 bg-surface p-6 shadow-lg shadow-ink/5">
      <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-b from-accent-soft/50 to-surface shadow-sm">
          {logoFailed ? (
            <span className="font-display text-xl text-accent-foreground">
              성
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-contain p-1.5"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
        <h1 className="font-display text-2xl text-ink">성장</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          믿음 안에서 함께 자라는 공간
        </p>
      </div>

      <div className="w-full shrink-0">
        {showRegisteredNotice ? (
          <p className="mb-3 rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent-foreground">
            가입이 완료되었습니다. 카카오로 로그인해 주세요.
          </p>
        ) : null}

        {(authError || clientError) ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            {authError ?? clientError}
          </p>
        ) : null}

        {!kakaoConfigured ? (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
            카카오 로그인 설정이 서버에 없습니다. AUTH_KAKAO_ID와
            AUTH_KAKAO_SECRET을 확인해 주세요.
          </p>
        ) : null}

        <button
          type="button"
          disabled={kakaoPending || !kakaoConfigured}
          onClick={() => void onKakaoLogin()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-semibold text-[#191919] shadow-sm transition hover:bg-[#f5dc00] active:scale-[0.99] disabled:opacity-60"
        >
          <KakaoIcon />
          {kakaoPending ? "이동 중…" : "카카오로 시작하기"}
        </button>

        <p className="mt-3 text-center text-[11px] leading-snug text-muted">
          처음 로그인 시 추가 정보 입력 후 승인됩니다
        </p>
      </div>
    </div>
  );
}
