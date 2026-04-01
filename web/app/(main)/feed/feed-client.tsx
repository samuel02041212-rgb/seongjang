"use client";

import { FeedStream } from "@/components/feed/feed-stream";

/** 공통 내비는 `(main)/layout` — 여기서는 피드 본문만 */
export function FeedClient() {
  return (
    <div className="mx-auto max-w-xl">
      <FeedStream />
    </div>
  );
}
