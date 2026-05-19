import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";
import { PostViewModeToggle } from "@/components/settings/post-view-mode-toggle";
import { ThemeToggle } from "@/components/settings/theme-toggle";

export const metadata: Metadata = {
  title: "설정 — 성경나눔장소",
};

export default function SettingsPage() {
  return (
    <SubPageLayout title="설정">
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="divide-y divide-line">
          <section className="px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">테마</h2>
            <p className="mt-1 text-xs text-muted">라이트·다크 모드 선택</p>
            <ThemeToggle />
          </section>
          <section className="px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-ink">게시글·채팅 뷰어</h2>
            <p className="mt-1 text-xs text-muted">
              피드에서 게시글을 열 때와 채팅을 열 때 같은 방식이 적용됩니다.
              이분할은 오른쪽 패널로 열려 화면을 보며 다른 작업을 이어갈 수
              있습니다.
            </p>
            <PostViewModeToggle />
          </section>
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
