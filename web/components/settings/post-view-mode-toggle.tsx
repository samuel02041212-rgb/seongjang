"use client";

import { usePostViewMode } from "@/lib/view-mode";

export function PostViewModeToggle() {
  const [mode, setMode] = usePostViewMode();

  return (
    <div className="mt-3 inline-flex rounded-full border border-line p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => setMode("split")}
        className={`rounded-full px-4 py-1.5 transition ${
          mode === "split"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        이분할
      </button>
      <button
        type="button"
        onClick={() => setMode("popup")}
        className={`rounded-full px-4 py-1.5 transition ${
          mode === "popup"
            ? "bg-accent text-accent-foreground"
            : "text-muted hover:text-ink"
        }`}
      >
        팝업
      </button>
    </div>
  );
}
