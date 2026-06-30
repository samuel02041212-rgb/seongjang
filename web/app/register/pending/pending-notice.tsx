"use client";

import { signOut } from "next-auth/react";

export function PendingNotice() {
  return (
    <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 text-center shadow-sm sm:p-8">
      <h1 className="font-display text-xl text-ink">승인 대기 중</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        가입 신청이 접수되었습니다.
        <br />
        관리자 승인 후 서비스를 이용할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/login" })}
        className="mt-6 w-full rounded-md border border-line py-3 text-sm font-medium text-ink transition hover:bg-accent-soft/40"
      >
        로그아웃
      </button>
    </div>
  );
}
