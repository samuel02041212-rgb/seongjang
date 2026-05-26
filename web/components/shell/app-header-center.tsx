"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { FEED_TZ, isFeedDateIso } from "@/lib/feed-date";

function formatHeaderDate(iso: string) {
  return new Date(`${iso}T12:00:00+09:00`).toLocaleDateString("ko-KR", {
    timeZone: FEED_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

import { useFeedBrowse } from "./feed-browse-context";

const headerCenterTextClass =
  "min-w-0 truncate text-center text-xs text-muted sm:text-sm";

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function FeedHeaderDateNav() {
  const { feedDate, today, canGoNewer, pickDate, goOlder, goNewer } =
    useFeedBrowse();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const btnClass =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-ink disabled:pointer-events-none disabled:opacity-25";

  const openCalendar = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.click();
    }
  };

  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-1/2 flex max-w-[min(100vw-11rem,28rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 px-1 sm:gap-1.5 sm:px-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={btnClass}
        onClick={goOlder}
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
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <time
        dateTime={feedDate}
        className={`${headerCenterTextClass} px-0.5`}
      >
        {formatHeaderDate(feedDate)}
      </time>
      <input
        ref={dateInputRef}
        type="date"
        value={feedDate}
        max={today}
        onChange={(e) => {
          const next = e.target.value;
          if (next && isFeedDateIso(next)) pickDate(next);
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        className={btnClass}
        onClick={openCalendar}
        aria-label="날짜 선택"
      >
        <CalendarIcon />
      </button>
      <button
        type="button"
        className={btnClass}
        onClick={goNewer}
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
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

function HeaderClock() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      setLabel(
        new Date().toLocaleString("ko-KR", {
          timeZone: FEED_TZ,
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p
      className={`pointer-events-none absolute left-1/2 top-1/2 max-w-[min(100vw-11rem,20rem)] -translate-x-1/2 -translate-y-1/2 px-2 ${headerCenterTextClass}`}
    >
      {label}
    </p>
  );
}

function isFeedPage(pathname: string) {
  if (pathname === "/feed") return true;
  return /^\/group\/[^/]+\/feed$/.test(pathname);
}

export function AppHeaderCenter() {
  const pathname = usePathname();
  if (isFeedPage(pathname)) return <FeedHeaderDateNav />;
  return <HeaderClock />;
}
