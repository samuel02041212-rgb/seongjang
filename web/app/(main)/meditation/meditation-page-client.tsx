"use client";

import { useRouter } from "next/navigation";

import { FeedComposer } from "@/components/feed/feed-composer";

import { MeditationBiblePanel } from "./meditation-bible-panel";

export function MeditationPageClient() {
  const router = useRouter();
  return (
    <div className="mx-auto w-full">
      <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="w-full shrink-0 lg:w-[calc(36rem*1.3)]">
          <FeedComposer
            matchPostCard
            isAuthenticated
            onPosted={() => {
              router.push("/feed");
              router.refresh();
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <MeditationBiblePanel />
        </div>
      </div>
    </div>
  );
}
