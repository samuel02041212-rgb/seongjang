import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "설정 — 성경나눔장소",
};

export default function SettingsPage() {
  return (
    <SubPageLayout title="설정">
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="divide-y divide-line">
          <section className="px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">알림</h2>
            <p className="mt-1 text-xs text-muted">
              푸시·이메일 알림 (연결 예정)
            </p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-full border border-line px-4 py-2 text-xs font-medium text-muted"
            >
              알림 설정
            </button>
          </section>
          <section className="px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">계정</h2>
            <p className="mt-1 text-xs text-muted">
              이메일·비밀번호 변경 (로그인 연동 후)
            </p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-full border border-line px-4 py-2 text-xs font-medium text-muted"
            >
              계정 관리
            </button>
          </section>
          <section className="px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">앱 정보</h2>
            <p className="mt-1 font-mono text-xs text-muted">성장 웹 · 미리보기</p>
          </section>
        </div>
      </div>
    </SubPageLayout>
  );
}
