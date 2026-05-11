"use client";

import { useRouter } from "next/navigation";

import { FeedComposer } from "@/components/feed/feed-composer";

import { MeditationBiblePanel } from "./meditation-bible-panel";

export function MeditationPageClient() {
  const router = useRouter();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">말씀 묵상 작성</h2>
        <p className="text-xs text-muted">
          여기서 작성한 글은 메인 피드에 표시됩니다.
        </p>
        <FeedComposer
          isAuthenticated
          onPosted={() => {
            router.push("/feed");
            router.refresh();
          }}
        />
      </div>
      <MeditationBiblePanel />
    </div>
  );
}
