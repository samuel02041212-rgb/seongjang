"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { PostDetailModal } from "@/components/feed/post-detail-modal";
import type { PinnedAnnouncementJson } from "@/lib/announcement";
import type { FeedPostJson } from "@/lib/feed-serialize";

const ROTATE_MS = 7000;

const megaphoneStroke = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function MegaphoneOutlineIcon({
  size = 22,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      {...megaphoneStroke}
      width={size}
      height={size}
      aria-hidden
      className={className}
    >
      <path d="M6 10h2.5l10.5-2.5v9L8.5 14H6V10z" />
      <path d="M6.5 14.75v3.75h2v-3.75" />
    </svg>
  );
}

export function MegaphoneNavIcon() {
  return <MegaphoneOutlineIcon />;
}

type PinnedAnnouncementContextValue = {
  hasPinned: boolean;
  currentTitle: string;
  items: PinnedAnnouncementJson[];
  listOpen: boolean;
  openCurrent: () => void;
  toggleList: () => void;
  closeList: () => void;
  openPost: (id: string) => void;
};

const PinnedAnnouncementContext =
  createContext<PinnedAnnouncementContextValue | null>(null);

export function usePinnedAnnouncement() {
  return useContext(PinnedAnnouncementContext);
}

export function PinnedAnnouncementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<PinnedAnnouncementJson[]>([]);
  const [idx, setIdx] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);

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
    if (items.length <= 1 || listOpen || detailPost) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      ROTATE_MS,
    );
    return () => clearInterval(t);
  }, [items.length, listOpen, detailPost]);

  useEffect(() => {
    if (!listOpen) return;
    function handle(e: MouseEvent | TouchEvent) {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-pinned-notice-ui]")) return;
      setListOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [listOpen]);

  const openPost = useCallback(async (id: string) => {
    setListOpen(false);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      setDetailPost((await res.json()) as FeedPostJson);
    } catch {
      void 0;
    }
  }, []);

  const openCurrent = useCallback(() => {
    if (items.length > 1) {
      setListOpen(true);
      return;
    }
    const current = items[idx % items.length];
    if (current) void openPost(current.id);
  }, [items, idx, openPost]);

  const value = useMemo(
    (): PinnedAnnouncementContextValue => ({
      hasPinned: items.length > 0,
      currentTitle: items[idx % items.length]?.title ?? "",
      items,
      listOpen,
      openCurrent,
      toggleList: () => setListOpen((v) => !v),
      closeList: () => setListOpen(false),
      openPost,
    }),
    [items, idx, listOpen, openCurrent, openPost],
  );

  return (
    <PinnedAnnouncementContext.Provider value={value}>
      {children}
      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        onCommentAdded={() => void 0}
        variant="popup"
      />
    </PinnedAnnouncementContext.Provider>
  );
}

export function PinnedNoticeHeaderTitle() {
  const ctx = usePinnedAnnouncement();
  if (!ctx?.hasPinned) return null;

  const showList = ctx.listOpen && ctx.items.length > 1;

  return (
    <div className="relative ml-10" data-tour="pinned-notice" data-pinned-notice-ui>
      <button
        type="button"
        onClick={ctx.openCurrent}
        className="min-w-0 max-w-[7rem] truncate text-center text-xs font-medium text-ink transition hover:opacity-80 sm:max-w-[11rem] sm:text-sm"
        aria-expanded={showList}
      >
        &quot;{ctx.currentTitle}&quot;
      </button>
      {showList ? (
        <ul className="absolute left-0 top-full z-[60] mt-1 min-w-[10rem] max-w-[14rem] overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-lg">
          {ctx.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void ctx.openPost(item.id)}
                className="block w-full truncate px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft sm:text-sm"
              >
                &quot;{item.title}&quot;
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PinnedNoticeNavButton({
  navBtnClass,
  navTip,
}: {
  navBtnClass: string;
  navTip: (label: string) => React.ReactNode;
}) {
  const ctx = usePinnedAnnouncement();

  return (
    <div className="relative" data-pinned-notice-ui>
      <button
        type="button"
        data-tour="nav-pinned"
        onClick={() => {
          if (!ctx) return;
          if (ctx.items.length === 0) {
            ctx.toggleList();
            return;
          }
          if (ctx.items.length === 1) void ctx.openPost(ctx.items[0].id);
          else ctx.toggleList();
        }}
        className={navBtnClass}
        aria-label="공지사항"
        aria-expanded={ctx?.listOpen ?? false}
      >
        <MegaphoneNavIcon />
        {!ctx?.listOpen ? navTip("공지사항") : null}
      </button>
      {ctx?.listOpen && ctx.items.length === 0 ? (
        <p className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 text-xs font-medium text-muted shadow-md">
          고정된 공지가 없습니다.
        </p>
      ) : null}
    </div>
  );
}
