"use client";

import { FeedStream } from "@/components/feed/feed-stream";
import { usePostViewMode } from "@/lib/view-mode";

export function FeedClient() {
  const [mode] = usePostViewMode();
  const split = mode === "split";

  return (
    <div className={split ? "max-w-xl" : "mx-auto max-w-xl"}>
      <FeedStream viewerVariant={split ? "side" : "popup"} />
    </div>
  );
}
