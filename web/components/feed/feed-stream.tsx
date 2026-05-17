"use client";

import { useChatPanel } from "@/components/chat/chat-dock";
import { feedTodayIso } from "@/lib/feed-date";
import {
  readFeedBrowse,
  readFeedPostsCache,
  saveFeedBrowse,
  saveFeedPostsCache,
  type FeedBrowseState,
} from "@/lib/feed-session";
import type { FeedPostJson } from "@/lib/feed-serialize";
import { useCallback, useEffect, useRef, useState } from "react";
import { FeedPostRow } from "./feed-post-row";
import { PostDetailModal } from "./post-detail-modal";

type FeedSource = "loading" | "ready" | "error";

export function FeedStream({
  feedDate,
  refreshTrigger = 0,
  viewerVariant = "popup",
  onDetailOpenChange,
}: {
  feedDate: string;
  refreshTrigger?: number;
  viewerVariant?: "popup" | "side";
  onDetailOpenChange?: (open: boolean) => void;
}) {
  const { bringPostDockToFront } = useChatPanel();
  const initialCache = readFeedPostsCache(feedDate);
  const [source, setSource] = useState<FeedSource>(
    initialCache?.length ? "ready" : "loading",
  );
  const [posts, setPosts] = useState<FeedPostJson[]>(initialCache ?? []);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);
  const [errorHint, setErrorHint] = useState("");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const snappedIdx = useRef(-1);
  const hasRestored = useRef(false);
  const stateRef = useRef({ feedDate, posts, detailPost });
  stateRef.current = { feedDate, posts, detailPost };

  const persistBrowse = useCallback(() => {
    const { feedDate: d, posts: list, detailPost: detail } = stateRef.current;
    let postId: string | null = null;
    if (detail?.id) {
      postId = detail.id;
    } else if (list.length) {
      let bestIdx = 0;
      let bestArea = 0;
      const vpBot = window.innerHeight;
      for (let i = 0; i < list.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const area = Math.max(
          0,
          Math.min(r.bottom, vpBot) - Math.max(r.top, 0),
        );
        if (area > bestArea) {
          bestArea = area;
          bestIdx = i;
        }
      }
      postId = list[bestIdx]?.id ?? null;
    }
    saveFeedBrowse({
      feedDate: d,
      scrollY: window.scrollY,
      postId,
      detailPostId: detail?.id ?? null,
    });
    if (list.length) saveFeedPostsCache(d, list);
  }, []);

  const applyRestore = useCallback(
    (saved: FeedBrowseState) => {
      const { posts: list } = stateRef.current;
      if (!list.length) return false;

      let scrolled = false;
      if (saved.postId) {
        const idx = list.findIndex((p) => p.id === saved.postId);
        const el = idx >= 0 ? cardRefs.current[idx] : null;
        if (el) {
          el.scrollIntoView({ block: "start" });
          snappedIdx.current = idx;
          scrolled = true;
        }
      }
      if (!scrolled && saved.scrollY > 0) {
        window.scrollTo(0, saved.scrollY);
        scrolled = true;
      }

      if (saved.detailPostId) {
        const p = list.find((x) => x.id === saved.detailPostId);
        if (p) {
          if (viewerVariant === "side") bringPostDockToFront();
          setDetailPost(p);
        }
      }

      return scrolled || !!saved.detailPostId;
    },
    [viewerVariant, bringPostDockToFront],
  );

  const tryRestore = useCallback(() => {
    if (hasRestored.current) return;
    const saved = readFeedBrowse();
    if (!saved || saved.feedDate !== feedDate) return;
    if (stateRef.current.posts.length === 0) return;

    let attempts = 0;
    const run = () => {
      if (hasRestored.current) return;
      attempts += 1;
      if (applyRestore(saved) || attempts >= 6) {
        hasRestored.current = true;
        return;
      }
      requestAnimationFrame(run);
    };

    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [feedDate, applyRestore]);

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

  useEffect(() => {
    hasRestored.current = false;
    const saved = readFeedBrowse();
    const c = readFeedPostsCache(feedDate);
    setPosts(c ?? []);
    setSource(c?.length ? "ready" : "loading");
    if (
      saved?.feedDate === feedDate &&
      (saved.postId || saved.scrollY > 0 || saved.detailPostId)
    ) {
      return;
    }
    setDetailPost(null);
    window.scrollTo(0, 0);
  }, [feedDate]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => persistBrowse(), 120);
    };
    const onHide = () => persistBrowse();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onHide);
      clearTimeout(t);
      persistBrowse();
    };
  }, [persistBrowse]);

  useEffect(() => {
    if (source !== "ready") return;
    const saved = readFeedBrowse();
    const shouldRestore =
      saved?.feedDate === feedDate &&
      !!(saved.postId || saved.scrollY > 0 || saved.detailPostId);
    if (!shouldRestore) {
      hasRestored.current = true;
      return;
    }
    tryRestore();
  }, [source, posts, feedDate, tryRestore]);

  useEffect(() => {
    let cancelled = false;
    const seed = readFeedPostsCache(feedDate);
    if (!seed?.length) setSource("loading");
    (async () => {
      setErrorHint("");
      try {
        const qs = new URLSearchParams({ date: feedDate });
        const res = await fetch(`/api/posts?${qs}`, { credentials: "include" });
        const data = (await res.json()) as unknown;
        if (cancelled) return;

        if (!res.ok || !Array.isArray(data)) {
          setPosts([]);
          setSource("error");
          setErrorHint(
            res.status === 401
              ? "세션이 만료되었습니다. 다시 로그인해 주세요."
              : "피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
          return;
        }

        const list = data as FeedPostJson[];
        saveFeedPostsCache(feedDate, list);
        setErrorHint("");
        setPosts(list);
        setSource("ready");
        setDetailPost((prev) => {
          if (!prev) return null;
          return list.find((p) => p.id === prev.id) ?? prev;
        });
      } catch {
        if (!cancelled) {
          if (!seed?.length) {
            setPosts([]);
            setSource("error");
          }
          setErrorHint(
            "피드를 불러오지 못했습니다. 네트워크·서버 설정을 확인해 주세요.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [feedDate, refreshTrigger]);

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
      if (viewerVariant === "side") bringPostDockToFront();
      setDetailPost(p);
      saveFeedBrowse({
        feedDate: stateRef.current.feedDate,
        scrollY: window.scrollY,
        postId: p.id,
        detailPostId: p.id,
      });
    },
    [viewerVariant, bringPostDockToFront],
  );

  const closeDetail = useCallback(() => {
    setDetailPost(null);
    requestAnimationFrame(() => persistBrowse());
  }, [persistBrowse]);

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
          {feedDate === feedTodayIso()
            ? "오늘 올라온 글이 없습니다. 말씀묵상에서 작성할 수 있습니다."
            : "이 날짜에 올라온 글이 없습니다."}
        </p>
      ) : (
        <div className="relative mb-6 space-y-[calc(0.75rem+30px)]">
          {posts.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="scroll-mt-[calc(var(--app-header-height)+40px)]"
            >
              <FeedPostRow
                post={p}
                onOpenDetail={openDetail}
                onLike={onLike}
              />
            </div>
          ))}
          {posts.length > 1 && (
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
          )}
        </div>
      )}

      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={closeDetail}
        onCommentAdded={() => detailPost && bumpCommentCount(detailPost.id)}
        previewMode={false}
        variant={viewerVariant}
      />
    </>
  );
}
