"use client";

import type { FeedPostJson } from "@/lib/feed-serialize";
import { useCallback, useEffect, useState } from "react";
import { FeedPostRow } from "./feed-post-row";
import { PostDetailModal } from "./post-detail-modal";

type FeedSource = "loading" | "ready" | "error";

export function FeedStream({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [source, setSource] = useState<FeedSource>("loading");
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/posts", { credentials: "include" });
        const data = (await res.json()) as unknown;
        if (cancelled) return;

        if (!res.ok || !Array.isArray(data)) {
          setPosts([]);
          setSource("error");
          return;
        }

        setPosts(data as FeedPostJson[]);
        setSource("ready");
      } catch {
        if (!cancelled) {
          setPosts([]);
          setSource("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

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
      /* ignore */
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

  return (
    <>
      {source === "loading" ? (
        <p className="py-10 text-center text-sm text-muted">
          피드를 불러오는 중…
        </p>
      ) : source === "error" ? (
        <p className="py-10 text-center text-sm text-red-800/90">
          피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          아직 올라온 글이 없습니다. 말씀묵상에서 작성할 수 있습니다.
        </p>
      ) : (
        <div className="mb-6 space-y-3">
          {posts.map((p) => (
            <FeedPostRow
              key={p.id}
              post={p}
              onOpenDetail={setDetailPost}
              onLike={onLike}
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
