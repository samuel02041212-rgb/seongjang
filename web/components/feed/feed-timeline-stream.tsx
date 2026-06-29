"use client";

import { usePinnedAnnouncement } from "@/components/announcement/pinned-announcement-context";
import { useChatPanel } from "@/components/chat/chat-dock";
import {
  formatFeedDividerDate,
  postFeedDateIso,
} from "@/lib/feed-date";
import { FEED_LAYOUT_TIMELINE } from "@/lib/feed-layout-mode";
import {
  readFeedBrowse,
  readFeedPostsCache,
  saveFeedBrowse,
  saveFeedPostsCache,
} from "@/lib/feed-session";
import type { FeedPostJson } from "@/lib/feed-serialize";
import { feedPostListClass } from "@/lib/feed-card-layout";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedPostRow } from "./feed-post-row";
import { PostDetailModal } from "./post-detail-modal";

type FeedSource = "loading" | "ready" | "error";

const PAGE = 30;

function FeedDateDivider({ dateIso }: { dateIso: string }) {
  const label = formatFeedDividerDate(dateIso);
  return (
    <div
      className="flex items-center gap-3 py-3"
      aria-label={`${label} 게시글`}
    >
      <span className="h-px flex-1 bg-line" />
      <span className="shrink-0 text-xs font-medium text-muted">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export function FeedTimelineStream({
  groupId,
  refreshTrigger = 0,
  viewerVariant = "popup",
  onDetailOpenChange,
}: {
  groupId?: string;
  refreshTrigger?: number;
  viewerVariant?: "popup" | "side";
  onDetailOpenChange?: (open: boolean) => void;
}) {
  const { bringPostDockToFront } = useChatPanel();
  const pinned = usePinnedAnnouncement();
  const cacheKey = FEED_LAYOUT_TIMELINE;
  const initialCache = readFeedPostsCache(cacheKey, groupId);
  const [source, setSource] = useState<FeedSource>(
    initialCache?.length ? "ready" : "loading",
  );
  const [posts, setPosts] = useState<FeedPostJson[]>(initialCache ?? []);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);
  const [errorHint, setErrorHint] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const snappedIdx = useRef(-1);
  const hasRestored = useRef(false);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const qs = new URLSearchParams({ timeline: "1" });
      if (groupId) qs.set("groupId", groupId);
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(`/api/posts?${qs}`, { credentials: "include" });
      const data = (await res.json()) as unknown;
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(res.status === 401 ? "auth" : "fetch");
      }
      return data as FeedPostJson[];
    },
    [groupId],
  );

  useEffect(() => {
    let cancelled = false;
    hasRestored.current = false;
    const seed = readFeedPostsCache(cacheKey, groupId);
    setPosts(seed ?? []);
    setSource(seed?.length ? "ready" : "loading");
    setHasMore(true);
    setDetailPost(null);

    (async () => {
      setErrorHint("");
      try {
        const list = await fetchPage();
        if (cancelled) return;
        saveFeedPostsCache(cacheKey, list, groupId);
        setPosts(list);
        setHasMore(list.length >= PAGE);
        setSource("ready");
      } catch {
        if (cancelled) return;
        if (!seed?.length) {
          setPosts([]);
          setSource("error");
        }
        setErrorHint(
          "피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupId, refreshTrigger, cacheKey, fetchPage]);

  useEffect(() => {
    if (source !== "ready" || hasRestored.current) return;
    const saved = readFeedBrowse(groupId);
    if (saved?.feedDate !== cacheKey) return;
    if (saved.scrollY > 0) window.scrollTo(0, saved.scrollY);
    if (saved.detailPostId) {
      const p = posts.find((x) => x.id === saved.detailPostId);
      if (p) {
        if (viewerVariant === "side") bringPostDockToFront();
        setDetailPost(p);
      }
    }
    hasRestored.current = true;
  }, [source, posts, groupId, cacheKey, viewerVariant, bringPostDockToFront]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const persist = () => {
      saveFeedBrowse(
        {
          feedDate: cacheKey,
          scrollY: window.scrollY,
          postId: null,
          detailPostId: detailPost?.id ?? null,
        },
        groupId,
      );
      if (posts.length) saveFeedPostsCache(cacheKey, posts, groupId);
    };
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(persist, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
      clearTimeout(t);
      persist();
    };
  }, [posts, detailPost, groupId, cacheKey]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loadingMore || source !== "ready") return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const last = posts[posts.length - 1];
        if (!last) return;
        setLoadingMore(true);
        void fetchPage(last.createdAt)
          .then((next) => {
            setPosts((prev) => {
              const ids = new Set(prev.map((p) => p.id));
              const merged = [...prev];
              for (const p of next) {
                if (!ids.has(p.id)) merged.push(p);
              }
              saveFeedPostsCache(cacheKey, merged, groupId);
              return merged;
            });
            setHasMore(next.length >= PAGE);
          })
          .catch(() => setHasMore(false))
          .finally(() => setLoadingMore(false));
      },
      { rootMargin: "240px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [posts, hasMore, loadingMore, source, fetchPage, groupId, cacheKey]);

  const getMostVisibleIdx = useCallback(() => {
    const refs = cardRefs.current;
    let bestIdx = 0;
    let bestArea = 0;
    const vpBot = window.innerHeight;
    for (let i = 0; i < refs.length; i++) {
      const el = refs[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const area = Math.max(0, Math.min(r.bottom, vpBot) - Math.max(r.top, 0));
      if (area > bestArea) {
        bestArea = area;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, []);

  const isSnapped = useCallback((idx: number) => {
    const el = cardRefs.current[idx];
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const scrollMt = parseFloat(getComputedStyle(el).scrollMarginTop || "0");
    return Math.abs(r.top - scrollMt) < 16;
  }, []);

  const scrollToIdx = useCallback((idx: number) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    snappedIdx.current = idx;
  }, []);

  const navigate = useCallback(
    (dir: -1 | 1) => {
      const vis = getMostVisibleIdx();
      if (snappedIdx.current === vis && isSnapped(vis)) {
        const next = vis + dir;
        if (next >= 0 && next < cardRefs.current.length) {
          scrollToIdx(next);
        }
      } else {
        scrollToIdx(vis);
      }
    },
    [getMostVisibleIdx, isSnapped, scrollToIdx],
  );

  const onBookmarkChange = useCallback(
    (postId: string, folderIds: string[]) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, bookmarkFolderIds: folderIds } : p,
        ),
      );
      setDetailPost((p) =>
        p?.id === postId ? { ...p, bookmarkFolderIds: folderIds } : p,
      );
    },
    [],
  );

  const onLike = useCallback(async (postId: string) => {
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(postId)}/like`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) return;
      const body = (await res.json()) as {
        ok?: boolean;
        liked?: boolean;
        likeCount?: number;
      };
      if (!body.ok) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLikedByMe: body.liked ?? !p.isLikedByMe,
                likeCount: body.likeCount ?? p.likeCount,
              }
            : p,
        ),
      );
      setDetailPost((p) =>
        p?.id === postId
          ? {
              ...p,
              isLikedByMe: body.liked ?? !p.isLikedByMe,
              likeCount: body.likeCount ?? p.likeCount,
            }
          : p,
      );
    } catch {
      void 0;
    }
  }, []);

  const bumpCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ),
    );
    setDetailPost((p) =>
      p?.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
    );
  }, []);

  useEffect(() => {
    if (viewerVariant !== "side") {
      onDetailOpenChange?.(false);
      return;
    }
    onDetailOpenChange?.(!!detailPost);
  }, [viewerVariant, detailPost, onDetailOpenChange]);

  const openDetail = useCallback(
    (p: FeedPostJson) => {
      if (p.kind === "announcement") {
        if (!groupId && pinned) {
          void pinned.openPost(p.id);
          return;
        }
        setDetailPost(p);
        return;
      }
      if (viewerVariant === "side") bringPostDockToFront();
      setDetailPost(p);
    },
    [viewerVariant, bringPostDockToFront, groupId, pinned],
  );

  let lastDate = "";

  return (
    <>
      {source === "loading" ? (
        <p className="py-10 text-center text-sm text-muted">
          피드를 불러오는 중…
        </p>
      ) : source === "error" ? (
        <p className="py-10 text-center text-sm text-red-800/90">
          {errorHint ||
            "피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}
        </p>
      ) : posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          아직 게시글이 없습니다. 말씀묵상에서 작성할 수 있습니다.
        </p>
      ) : (
        <div className={feedPostListClass}>
          {posts.map((p, i) => {
            const dateIso = postFeedDateIso(p.createdAt);
            const showDivider = dateIso !== lastDate;
            lastDate = dateIso;
            return (
              <div key={p.id}>
                {showDivider ? <FeedDateDivider dateIso={dateIso} /> : null}
                <div
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="scroll-mt-[calc(var(--app-header-height)+40px)]"
                >
                  <FeedPostRow
                    post={p}
                    onOpenDetail={openDetail}
                    onLike={onLike}
                    showBookmark
                    onBookmarkChange={onBookmarkChange}
                  />
                </div>
              </div>
            );
          })}
          {posts.length > 1 ? (
            <div className="pointer-events-none sticky bottom-8 z-30 flex justify-end pr-0">
              <div className="pointer-events-auto -mr-14 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-md transition-colors hover:bg-accent-soft"
                  aria-label="이전 게시글"
                >
                  <svg
                    width="18"
                    height="18"
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
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-md transition-colors hover:bg-accent-soft"
                  aria-label="다음 게시글"
                >
                  <svg
                    width="18"
                    height="18"
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
            </div>
          ) : null}
          {hasMore ? (
            <div
              ref={loadMoreRef}
              className="py-6 text-center text-xs text-muted"
            >
              {loadingMore ? "더 불러오는 중…" : ""}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-muted">
              더 이상 게시글이 없습니다.
            </p>
          )}
        </div>
      )}

      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        onCommentAdded={() => detailPost && bumpCommentCount(detailPost.id)}
        previewMode={false}
        variant={
          detailPost?.kind === "announcement" ? "popup" : viewerVariant
        }
      />
    </>
  );
}
