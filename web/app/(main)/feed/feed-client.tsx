"use client";

import { useChatPanel } from "@/components/chat/chat-dock";
import { FeedStream } from "@/components/feed/feed-stream";
import { usePostViewMode } from "@/lib/view-mode";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

const XL_PX = 576;

function pullMarginPx(): number {
  if (typeof window === "undefined") return 72;
  if (window.matchMedia("(min-width: 1024px)").matches) return 48;
  if (window.matchMedia("(min-width: 640px)").matches) return 96;
  return 72;
}

function SplitFeedSlide() {
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
    const feedW = Math.min(XL_PX, w);
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
        className="max-w-xl w-full transition-[transform,margin-left] duration-300 ease-out will-change-[transform,margin-left]"
        style={
          dockOpen
            ? {
                marginLeft: -pullPx,
                transform: "translateX(0px)",
              }
            : {
                marginLeft: 0,
                transform: `translateX(${centerShift}px)`,
              }
        }
      >
        <FeedStream viewerVariant="side" onDetailOpenChange={setDetailOpen} />
      </div>
    </div>
  );
}

export function FeedClient() {
  const [mode] = usePostViewMode();
  const split = mode === "split";

  if (!split) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <FeedStream viewerVariant="popup" />
      </div>
    );
  }

  return <SplitFeedSlide />;
}
