"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { safeCallbackUrl } from "@/lib/safe-callback-url";

export function LoginForm({
  showRegisteredNotice,
}: {
  showRegisteredNotice?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"), "/feed");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const res = await signIn("credentials", {
      email: loginId.trim(),
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError(
        "로그인에 실패했습니다. 아이디(이메일)·비밀번호를 확인하거나 승인 대기 중인지 확인해 주세요.",
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
      <h1 className="text-xl font-semibold text-ink">로그인</h1>
      <p className="mt-1 text-sm text-muted">
        성경나눔장소에 오신 것을 환영합니다.
      </p>

      {showRegisteredNotice ? (
        <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-foreground">
          가입이 완료되었습니다. 로그인해 주세요.
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div>
          <label htmlFor="login-id" className="text-sm font-medium text-ink">
            아이디 또는 이메일
          </label>
          <input
            id="login-id"
            name="email"
            type="text"
            autoComplete="username"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="가입 시 이메일"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-sm font-medium text-ink">
            비밀번호
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90 disabled:opacity-60"
        >
          {pending ? "확인 중…" : "로그인"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link
          href="/register"
          className="font-medium text-accent-foreground underline-offset-2 hover:underline"
        >
          회원가입
        </Link>
      </p>
      <p className="mt-3 text-center">
        <Link href="/" className="text-sm text-muted hover:text-ink">
          ← 처음으로
        </Link>
      </p>
    </div>
  );
}
