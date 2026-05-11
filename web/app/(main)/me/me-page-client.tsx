"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FeedPostRow } from "@/components/feed/feed-post-row";
import { PostDetailModal } from "@/components/feed/post-detail-modal";
import type { FeedPostJson } from "@/lib/feed-serialize";

export function MePageClient() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"posts" | "calendar">("posts");
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "회원";
  const initial = (displayName || "?").slice(0, 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/posts?mine=1", { credentials: "include" });
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
  }, []);

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

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#fff4d2] text-2xl font-bold text-[#5c4d2c]">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{displayName}</p>
            <p className="mt-1 text-sm text-muted">상태 메시지 (연결 후 수정)</p>
            <button
              type="button"
              disabled
              className="mt-3 rounded-full border border-line bg-bg px-4 py-2 text-xs font-medium text-muted"
            >
              프로필 수정
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            tab === "posts"
              ? "border-b-2 border-accent text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          내 게시글
        </button>
        <button
          type="button"
          onClick={() => setTab("calendar")}
          className={`flex-1 py-3 text-sm font-medium transition ${
            tab === "calendar"
              ? "border-b-2 border-accent text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          달력
        </button>
      </div>

      {tab === "posts" ? (
        <div className="p-4 sm:p-6">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted">불러오는 중…</p>
          ) : posts.length === 0 ? (
            <>
              <p className="text-center text-sm text-muted">
                아직 작성한 글이 없습니다.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/meditation"
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground"
                >
                  말씀묵상 쓰기
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-3">
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
            onCommentAdded={() =>
              detailPost && bumpCommentCount(detailPost.id)
            }
            previewMode={false}
          />
        </div>
      ) : (
        <div className="p-6">
          <div className="rounded-xl border border-dashed border-line bg-bg p-8 text-center">
            <p className="text-sm font-medium text-ink">일정 달력</p>
            <p className="mt-2 text-xs text-muted">
              관리자 일정·내 일정은 API 연결 후 표시됩니다.
            </p>
            <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <span key={d}>{d}</span>
              ))}
              {Array.from({ length: 28 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded border border-line/60 bg-surface text-[11px] leading-tight text-ink"
                >
                  <span className="inline-block p-1">{(i % 28) + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
