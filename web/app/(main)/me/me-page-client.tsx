"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BookmarksPanel } from "@/components/me/bookmarks-panel";
import { FeedPostRow } from "@/components/feed/feed-post-row";
import { PostDetailModal } from "@/components/feed/post-detail-modal";
import { ProfileEditModal } from "@/components/me/profile-edit-modal";
import { ProfileAvatar } from "@/components/me/profile-avatar";
import {
  feedPostListClass,
  feedPostListWrapClass,
} from "@/lib/feed-card-layout";
import type { FeedPostJson } from "@/lib/feed-serialize";

type MeJson = {
  id: string;
  name: string | null;
  church: string;
  statusMessage: string;
  image: string | null;
};

export function MePageClient() {
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<"posts" | "calendar" | "bookmarks">("posts");
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);
  const [me, setMe] = useState<MeJson | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const displayName =
    me?.name?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "회원";
  const avatarImage = me?.image ?? session?.user?.image ?? null;

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as MeJson | null;
      if (data) setMe(data);
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

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

  return (
    <section className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="border-b border-line p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ProfileAvatar
            image={avatarImage}
            editable
            onEdit={() => setEditOpen(true)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{displayName}</p>
            {me?.statusMessage?.trim() ? (
              <p className="mt-1 text-sm text-ink/90">{me.statusMessage.trim()}</p>
            ) : null}
            {me?.church ? (
              <p className="mt-1 text-sm text-muted">{me.church}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setTab("posts")}
          title="내 게시글"
          aria-label="내 게시글"
          className={`flex flex-1 items-center justify-center py-3 transition ${
            tab === "posts"
              ? "border-b-2 border-accent text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setTab("calendar")}
          title="달력"
          aria-label="달력"
          className={`flex flex-1 items-center justify-center py-3 transition ${
            tab === "calendar"
              ? "border-b-2 border-accent text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          <svg
            width="20"
            height="20"
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
        </button>
        <button
          type="button"
          onClick={() => setTab("bookmarks")}
          title="책깔피"
          aria-label="책깔피"
          className={`flex flex-1 items-center justify-center py-3 transition ${
            tab === "bookmarks"
              ? "border-b-2 border-accent text-ink"
              : "text-muted hover:text-ink"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {tab === "posts" ? (
        <>
          {loading ? (
            <p className="px-4 pb-6 pt-6 text-center text-sm text-muted sm:px-6 sm:pt-8">
              불러오는 중…
            </p>
          ) : posts.length === 0 ? (
            <div className="px-4 pb-6 pt-6 sm:px-6 sm:pt-8">
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
            </div>
          ) : (
            <div
              className={`${feedPostListWrapClass} ${feedPostListClass} pt-6 sm:pt-8`}
            >
              {posts.map((p) => (
                <FeedPostRow
                  key={p.id}
                  post={p}
                  onOpenDetail={setDetailPost}
                  onLike={onLike}
                  showBookmark
                  onBookmarkChange={onBookmarkChange}
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
        </>
      ) : tab === "bookmarks" ? (
        <div className="p-5 sm:p-8">
          <BookmarksPanel />
        </div>
      ) : (
        <div className="p-5 sm:p-8">
          <div className="rounded-md border border-dashed border-line bg-bg p-8 text-center">
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

      <ProfileEditModal
        open={editOpen}
        initialName={me?.name ?? displayName}
        initialStatusMessage={me?.statusMessage ?? ""}
        initialImage={avatarImage}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await loadMe();
          try {
            await updateSession();
          } catch {
            void 0;
          }
        }}
      />
    </section>
  );
}
