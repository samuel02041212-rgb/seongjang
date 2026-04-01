import type { Metadata } from "next";

import { SubPageLayout } from "@/components/shell/sub-page-layout";

export const metadata: Metadata = {
  title: "채팅 — 성장",
  description: "1:1·그룹 대화 (오른쪽 패널)",
};

export default function ChatHelpPage() {
  return (
    <SubPageLayout title="채팅">
      <p className="text-sm text-ink">
        화면{" "}
        <strong className="font-semibold">오른쪽 하단의 💬 버튼</strong>에서
        채팅 패널을 열 수 있습니다. 방 목록·검색·전송은 API 연동 후
        표시됩니다.
      </p>
    </SubPageLayout>
  );
}
