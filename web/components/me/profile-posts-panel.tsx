"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FeedPostRow } from "@/components/feed/feed-post-row";
import { PostDetailModal } from "@/components/feed/post-detail-modal";
import {
  feedPostListClass,
  mePageFeedCardSizeClass,
  mePagePostListWrapClass,
} from "@/lib/feed-card-layout";
import { feedTodayIso, postFeedDateIso } from "@/lib/feed-date";
import type { FeedPostJson } from "@/lib/feed-serialize";

type ProfilePostsPanelProps = {
  postsUrl: string;
  emptyMessage: string;
  emptyAction?: { href: string; label: string };
  showBookmark?: boolean;
};

export function ProfilePostsPanel({
  postsUrl,
  emptyMessage,
  emptyAction,
  showBookmark = true,
}: ProfilePostsPanelProps) {
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const hasPostFilters = !!dateFilter || !!searchQ.trim();

  const filteredPosts = useMemo(() => {
    let list = posts;
    if (dateFilter) {
      list = list.filter(
        (p) => postFeedDateIso(p.createdAt) === dateFilter,
      );
    }
    const q = searchQ.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.bibleRef.toLowerCase().includes(q),
      );
    }
    return list;
  }, [posts, dateFilter, searchQ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(postsUrl, { credentials: "include" });
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        if (!res.ok || !Array.isArray(data)) {
          setPosts([]);
          return;
        }
        setPosts(data as FeedPostJson[]);
      } catch {
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postsUrl]);

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

  const clearFilters = () => {
    setSearchQ("");
    setDateFilter("");
  };

  return (
    <>
      {!loading && posts.length > 0 ? (
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="제목·본문·말씀 검색"
            className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              max={feedTodayIso()}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              aria-label="작성일"
            />
            {hasPostFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-accent-soft hover:text-ink"
              >
                초기화
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {loading ? (
        <p className="px-4 pb-6 pt-6 text-center text-sm text-muted sm:px-6 sm:pt-8">
          불러오는 중…
        </p>
      ) : posts.length === 0 ? (
        <div className="px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
          <p className="text-center text-sm text-muted">{emptyMessage}</p>
          {emptyAction ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={emptyAction.href}
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground"
              >
                {emptyAction.label}
              </Link>
            </div>
          ) : null}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
          <p className="text-center text-sm text-muted">
            조건에 맞는 글이 없습니다.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-accent-soft"
            >
              필터 초기화
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${mePagePostListWrapClass} ${feedPostListClass} pt-6 sm:pt-8`}
        >
          {filteredPosts.map((p) => (
            <FeedPostRow
              key={p.id}
              post={p}
              cardSizeClass={mePageFeedCardSizeClass}
              onOpenDetail={setDetailPost}
              onLike={onLike}
              showBookmark={showBookmark}
              onBookmarkChange={showBookmark ? onBookmarkChange : undefined}
            />
          ))}
        </div>
      )}
      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        onCommentAdded={() => detailPost && bumpCommentCount(detailPost.id)}
        previewMode={false}
      />
    </>
  );
}
