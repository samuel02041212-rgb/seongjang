import type { Metadata } from "next";
import Link from "next/link";

import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "말씀연구 — 성경나눔장소",
  description: "성경 연구 (준비 중)",
};

export default function StudyPage() {
  return (
    <SubPageLayout title="말씀연구">
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-ink">coming soon</p>
        <p className="mt-3 text-sm text-muted">
          레거시와 같이 말씀연구 전용 화면을 단계적으로 붙입니다.
        </p>
      </div>
      <ul className="mt-6 space-y-3 rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
        <li className="flex gap-2">
          <span className="text-accent" aria-hidden>
            ·
          </span>
          주제·레슨 자료 목록
        </li>
        <li className="flex gap-2">
          <span className="text-accent" aria-hidden>
            ·
          </span>
          모임별 스터디 노트 (추후)
        </li>
        <li className="flex gap-2">
          <span className="text-accent" aria-hidden>
            ·
          </span>
          성경 뷰어와 링크 연동
        </li>
      </ul>
      <div className="mt-8 text-center">
        <Link
          href="/meditation"
          className="text-sm font-medium text-accent-foreground underline decoration-accent"
        >
          말씀묵상으로 이동
        </Link>
      </div>
    </SubPageLayout>
  );
}
