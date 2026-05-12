"use client";

import { useRouter } from "next/navigation";

import { FeedComposer } from "@/components/feed/feed-composer";

import { MeditationBiblePanel } from "./meditation-bible-panel";

export function MeditationPageClient() {
  const router = useRouter();
  return (
    <div className="mx-auto w-full">
      <div className="grid gap-4 lg:h-[78vh] lg:grid-cols-2">
        <div className="lg:h-full lg:overflow-y-auto">
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
    </div>
  );
}
