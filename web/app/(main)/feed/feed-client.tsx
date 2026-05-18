"use client";

import { useChatPanel } from "@/components/chat/chat-dock";
import { FeedStream } from "@/components/feed/feed-stream";
import { FEED_CARD_MAX_WIDTH_PX, feedCardMaxWidthClass } from "@/lib/feed-card-layout";
import {
  feedDateAddDays,
  feedDateLabel,
  feedTodayIso,
} from "@/lib/feed-date";
import { readFeedBrowse, saveFeedBrowse } from "@/lib/feed-session";
import { usePostViewMode } from "@/lib/view-mode";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function FeedDateStripe({
  feedDate,
  onOlder,
  onNewer,
  canGoNewer,
}: {
  feedDate: string;
  onOlder: () => void;
  onNewer: () => void;
  canGoNewer: boolean;
}) {
  const label = feedDateLabel(feedDate);
  const btnClass =
    "flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink disabled:pointer-events-none disabled:opacity-25";

  return (
    <div
      className="fixed left-16 top-[calc(var(--app-header-height)+1.75rem)] z-30 hidden flex-col items-center pl-1 lg:flex"
    >
      <button
        type="button"
        className={btnClass}
        onClick={onOlder}
        aria-label="이전 날짜"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <time
        dateTime={feedDate}
        lang="en"
        className="my-1 flex flex-col items-center font-handwriting text-[1.65rem] text-muted"
      >
        {label.split("").map((ch, i) =>
          ch === " " ? (
            <span key={i} className="h-2 shrink-0" aria-hidden />
          ) : (
            <span key={i} className="leading-none">
              {ch}
            </span>
          ),
        )}
      </time>
      <button
        type="button"
        className={btnClass}
        onClick={onNewer}
        disabled={!canGoNewer}
        aria-label="다음 날짜"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}

const SPLIT_DOCK_PULL_EXTRA_PX = 95;

function pullMarginPx(): number {
  if (typeof window === "undefined") return 72;
  if (window.matchMedia("(min-width: 1024px)").matches) return 48;
  if (window.matchMedia("(min-width: 640px)").matches) return 96;
  return 72;
}

function SplitFeedSlide({ feedDate }: { feedDate: string }) {
  const { chatOpen } = useChatPanel();
  const [detailOpen, setDetailOpen] = useState(false);
  const dockOpen = detailOpen || chatOpen;
  const trackRef = useRef<HTMLDivElement>(null);
  const [centerShift, setCenterShift] = useState(0);
  const [pullPx, setPullPx] = useState(72);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const feedW = Math.min(FEED_CARD_MAX_WIDTH_PX, w);
    setCenterShift(Math.max(0, (w - feedW) / 2));
    setPullPx(pullMarginPx());
  }, []);

  useLayoutEffect(() => {
    sync();
    const mqSm = window.matchMedia("(min-width: 640px)");
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const onBp = () => sync();
    mqSm.addEventListener("change", onBp);
    mqLg.addEventListener("change", onBp);
    window.addEventListener("resize", sync);
    const el = trackRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(sync);
      ro.observe(el);
    }
    return () => {
      mqSm.removeEventListener("change", onBp);
      mqLg.removeEventListener("change", onBp);
      window.removeEventListener("resize", sync);
      ro?.disconnect();
    };
  }, [sync]);

  return (
    <div ref={trackRef} className="w-full min-w-0">
      <div
        className={`${feedCardMaxWidthClass} w-full transition-[transform,margin-left] duration-300 ease-out will-change-[transform,margin-left]`}
        style={
          dockOpen
            ? {
                marginLeft: -(pullPx + 60 + SPLIT_DOCK_PULL_EXTRA_PX),
                transform: "translateX(0px)",
              }
            : {
                marginLeft: 0,
                transform: `translateX(${centerShift}px)`,
              }
        }
      >
        <FeedStream
          feedDate={feedDate}
          viewerVariant="side"
          onDetailOpenChange={setDetailOpen}
        />
      </div>
    </div>
  );
}

export function FeedClient() {
  const [mode] = usePostViewMode();
  const split = mode === "split";
  const [feedDate, setFeedDate] = useState(() => {
    return readFeedBrowse()?.feedDate ?? feedTodayIso();
  });
  const today = feedTodayIso();
  const canGoNewer = feedDate < today;

  const pickDate = (next: string) => {
    saveFeedBrowse({
      feedDate: next,
      scrollY: 0,
      postId: null,
      detailPostId: null,
    });
    setFeedDate(next);
  };

  const goOlder = () => pickDate(feedDateAddDays(feedDate, -1));
  const goNewer = () => {
    if (!canGoNewer) return;
    pickDate(feedDateAddDays(feedDate, 1));
  };

  const stripe = (
    <FeedDateStripe
      feedDate={feedDate}
      onOlder={goOlder}
      onNewer={goNewer}
      canGoNewer={canGoNewer}
    />
  );

  if (!split) {
    return (
      <>
        {stripe}
        <div className={`mx-auto w-full ${feedCardMaxWidthClass}`}>
          <FeedStream feedDate={feedDate} viewerVariant="popup" />
        </div>
      </>
    );
  }

  return (
    <>
      {stripe}
      <SplitFeedSlide feedDate={feedDate} />
    </>
  );
}
