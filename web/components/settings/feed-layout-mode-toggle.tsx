"use client";

import { useFeedLayoutMode } from "@/lib/feed-layout-mode";

export function FeedLayoutModeToggle() {
  const [mode, setMode] = useFeedLayoutMode();

  return (
    <div className="mt-3 inline-flex rounded-full border border-line p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => setMode("timeline")}
        className={`rounded-full px-4 py-1.5 transition ${
          mode === "timeline"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        연속 보기
      </button>
      <button
        type="button"
        onClick={() => setMode("daily")}
        className={`rounded-full px-4 py-1.5 transition ${
          mode === "daily"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        날짜별
      </button>
    </div>
  );
}
