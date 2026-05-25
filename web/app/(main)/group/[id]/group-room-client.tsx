"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "feed" | "chat" | "schedule";

export function GroupRoomClient({
  groupId,
  groupName,
  statusMessage,
  image,
}: {
  groupId: string;
  groupName: string;
  statusMessage?: string;
  image?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("feed");

  return (
    <>
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {groupName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">{groupName}</p>
          {statusMessage ? (
            <p className="truncate text-xs text-muted">{statusMessage}</p>
          ) : null}
        </div>
        <Link
          href="/group/mygroups"
          className="shrink-0 text-xs font-medium text-accent-foreground hover:underline"
        >
          ← 목록
        </Link>
      </div>

      <div className="flex gap-1 rounded-lg border border-line bg-surface p-1 shadow-sm">
        {(
          [
            ["feed", "피드"],
            ["chat", "채팅"],
            ["schedule", "일정"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === key
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[240px] rounded-lg border border-dashed border-line bg-bg p-8 text-center">
        {tab === "feed" && (
          <>
            <p className="text-sm font-medium text-ink">그룹 전용 피드</p>
            <p className="mt-2 text-xs text-muted">
              <code className="rounded bg-accent-soft px-1">visibleGroupIds</code>{" "}
              로 필터된 게시물이 여기에 쌓입니다.
            </p>
          </>
        )}
        {tab === "chat" && (
          <div className="text-left">
            <p className="text-sm font-medium text-ink">이 방의 채팅</p>
            <p className="mt-2 text-xs text-muted">
              화면 오른쪽 하단 <strong className="text-ink">💬</strong> 버튼을
              눌러 채팅 패널을 연 뒤, 목록에서 대화 상대를 선택하세요. (레거시
              UI와 동일한 도킹·플로팅 창)
            </p>
            <p className="mt-3 text-xs text-muted">
              그룹별 방 연결·전송·실시간은 이후 Socket.IO·REST 연동 예정입니다.
            </p>
          </div>
        )}
        {tab === "schedule" && (
          <>
            <p className="text-sm font-medium text-ink">모임 일정</p>
            <p className="mt-2 text-xs text-muted">
              그룹·관리자 일정 API 연동 예정
            </p>
          </>
        )}
      </div>
    </>
  );
}
