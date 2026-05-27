"use client";

import { useEffect, useRef, useState } from "react";

import type { PinnedAnnouncementJson } from "@/lib/announcement";

const ROTATE_MS = 5000;

function MegaphoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-ink"
      aria-hidden
    >
      <path d="M3 10v4l5.5 2.75V7.25L3 10z" />
      <path d="M8.5 7.25 18.5 12 8.5 16.75V7.25z" />
      <path d="M5.5 16.5v3.5h2" />
    </svg>
  );
}

export function FeedPinnedNotice({
  onOpen,
}: {
  onOpen?: (id: string) => void;
}) {
  const [items, setItems] = useState<PinnedAnnouncementJson[]>([]);
  const [idx, setIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/announcements/pinned", {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as unknown;
        if (!cancelled && Array.isArray(data)) {
          setItems(data as PinnedAnnouncementJson[]);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIdx(0);
    setListOpen(false);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1 || listOpen) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [items.length, listOpen]);

  useEffect(() => {
    if (!listOpen) return;
    function handle(e: MouseEvent | TouchEvent) {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setListOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [listOpen]);

  if (!items.length) return null;

  const current = items[idx % items.length];
  const multiple = items.length > 1;

  function openOne(id: string) {
    setListOpen(false);
    onOpen?.(id);
  }

  function onBannerClick() {
    if (multiple) {
      setListOpen((v) => !v);
      return;
    }
    openOne(current.id);
  }

  return (
    <div ref={wrapRef} className="relative z-40">
      <button
        type="button"
        onClick={onBannerClick}
        aria-expanded={multiple ? listOpen : undefined}
        className="flex w-full items-center justify-start gap-2.5 py-2.5 pl-0 pr-2 text-base text-ink transition hover:opacity-80"
      >
        <MegaphoneIcon />
        <span className="min-w-0 truncate font-medium">{current.title}</span>
      </button>

      {multiple && listOpen ? (
        <ul className="absolute left-0 top-full min-w-full bg-bg py-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => openOne(item.id)}
                className="flex w-full items-center justify-start gap-2.5 py-2 pl-0 pr-2 text-base text-ink transition hover:opacity-80"
              >
                <MegaphoneIcon />
                <span className="min-w-0 truncate font-medium">{item.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
