"use client";

import { useChatPanel } from "@/components/chat/chat-dock";
import {
  feedPostBodyAreaClass,
  feedPostBodyTextClass,
  feedPostBibleRefClass,
  feedPostInnerClass,
  feedPostTitleClass,
} from "@/lib/feed-post-body-layout";
import { feedCardMaxWidthClass } from "@/lib/feed-card-layout";
import {
  type FeedPostJson,
  formatFeedRelativeTime,
} from "@/lib/feed-serialize";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FeedPostImages } from "./feed-post-images";
import { ImageViewerModal } from "./image-viewer-modal";
import { AuthorProfileLink } from "@/components/me/author-profile-link";

type CommentItem = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
};

type PostDetailModalProps = {
  post: FeedPostJson | null;
  open: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  previewMode?: boolean;
  variant?: "popup" | "side";
};

export function PostDetailModal({
  post,
  open,
  onClose,
  onCommentAdded,
  previewMode = false,
  variant = "popup",
}: PostDetailModalProps) {
  const { splitDockTop, bringPostDockToFront } = useChatPanel();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setImgIdx(0);
    setViewerOpen(false);
    setCommentsOpen(false);
  }, [post?.id]);

  const loadComments = useCallback(async (postId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = (await res.json()) as CommentItem[];
        setComments(Array.isArray(data) ? data : []);
      } else setComments([]);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewMode) {
      setComments([]);
      setLoading(false);
      return;
    }
    if (open && post?.id) {
      void loadComments(post.id);
      if (textareaRef.current) textareaRef.current.value = "";
    }
  }, [open, post?.id, loadComments, previewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submitComment() {
    if (previewMode || !post) return;
    const content = textareaRef.current?.value.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok && textareaRef.current) {
        textareaRef.current.value = "";
        await loadComments(post.id);
        onCommentAdded();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !post) return null;

  const isSide = variant === "side";
  const isAnnouncement = post.kind === "announcement";
  const commentCountLabel = previewMode
    ? post.commentCount
    : loading
      ? "…"
      : comments.length;

  const panel = (
    <div
      className={
        isSide
          ? "fixed right-0 top-[var(--app-header-height)] bottom-0 flex w-[min(90.25vw,45.6rem)] flex-col overflow-hidden border-l border-t border-line bg-surface shadow-xl"
          : "relative flex aspect-video w-[min(95vw,calc(95vh*16/9),80rem)] flex-col overflow-hidden rounded-lg bg-surface shadow-xl"
      }
      role="dialog"
      aria-modal={isSide ? undefined : "true"}
      aria-labelledby="post-detail-title"
      style={
        isSide
          ? {
              zIndex: splitDockTop === "post" ? 40 : 30,
            }
          : undefined
      }
      onPointerDownCapture={isSide ? () => bringPostDockToFront() : undefined}
    >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="post-detail-title" className="sr-only">
            게시글 상세
          </h2>
          <span className="text-sm font-medium text-muted">게시글</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted hover:bg-accent-soft hover:text-ink"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className={`flex min-h-0 flex-1 ${isSide ? "flex-col" : "flex-row"}`}>
        <div className="min-w-0 min-h-0 flex-1 overflow-y-auto">
          <div className={`mx-auto w-full ${feedCardMaxWidthClass}`}>
          <div className={feedPostInnerClass}>
            {isAnnouncement ? (
              <>
                {post.authorName ? (
                  <p className="text-center text-xs text-muted">{post.authorName}</p>
                ) : null}
                {post.title ? (
                  <h3 className={`${feedPostTitleClass} mt-1 text-center`}>
                    {post.title}
                  </h3>
                ) : null}
                <div className={`flex justify-end ${post.title ? "mt-1" : ""}`}>
                  <time
                    className="text-xs text-muted whitespace-nowrap"
                    dateTime={post.createdAt}
                  >
                    {formatFeedRelativeTime(post.createdAt)} ·{" "}
                    {new Date(post.createdAt).toLocaleString("ko-KR")}
                  </time>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-x-2 gap-y-1">
                  <div className="min-w-0 flex-1">
                    {post.title ? (
                      <h3 className={feedPostTitleClass}>{post.title}</h3>
                    ) : null}
                  </div>
                  {post.authorName || post.authorChurch ? (
                    <AuthorProfileLink
                      authorId={post.authorId}
                      authorName={post.authorName}
                      authorChurch={post.authorChurch}
                      linkable={!isAnnouncement}
                      className="max-w-[45%] shrink-0 truncate text-right text-xs text-muted"
                    />
                  ) : null}
                </div>
                <div
                  className={`flex items-baseline justify-between gap-x-3 ${post.title || post.bibleRef ? "mt-1" : ""}`}
                >
                  {post.bibleRef ? (
                    <p className={`min-w-0 flex-1 ${feedPostBibleRefClass}`}>
                      {post.bibleRef}
                    </p>
                  ) : (
                    <span className="min-w-0 flex-1" aria-hidden />
                  )}
                  <time
                    className="shrink-0 text-right text-xs text-muted whitespace-nowrap"
                    dateTime={post.createdAt}
                  >
                    {formatFeedRelativeTime(post.createdAt)} ·{" "}
                    {new Date(post.createdAt).toLocaleString("ko-KR")}
                  </time>
                </div>
              </>
            )}
            {post.visibleGroupLabel ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex max-w-full items-center rounded-md border border-line bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
                  {post.visibleGroupLabel}
                </span>
              </div>
            ) : null}

          <FeedPostImages
            urls={post.imageUrls}
            large={false}
            index={imgIdx}
            onIndexChange={setImgIdx}
            onImageClick={() => setViewerOpen(true)}
          />

          <div className={feedPostBodyAreaClass}>
            <p className={feedPostBodyTextClass}>{post.content}</p>
          </div>
          </div>
          </div>
        </div>

        <div
          className={`flex min-w-0 shrink-0 flex-col overflow-x-hidden bg-bg ${
            isSide ? "border-t border-line" : "w-[22rem] border-l border-line"
          }`}
        >
          {isSide ? (
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-accent-soft/50"
              aria-expanded={commentsOpen}
              onClick={() => setCommentsOpen((o) => !o)}
            >
              <span>댓글 {commentCountLabel}개</span>
              <span className="text-muted" aria-hidden>
                {commentsOpen ? "▼" : "▲"}
              </span>
            </button>
          ) : (
            <div className="border-b border-line px-4 py-2 text-sm font-semibold text-ink">
              댓글 {commentCountLabel}개
            </div>
          )}

          {(!isSide || commentsOpen) && (
            <div
              className={`flex min-h-0 flex-col overflow-hidden ${
                isSide ? "h-[22.5rem]" : "min-h-0 flex-1"
              }`}
            >
              {previewMode ? (
                <p className="px-4 py-3 text-sm text-muted">
                  미리보기 모드에서는 댓글 목록·작성이 비활성화됩니다.
                </p>
              ) : (
                <>
                  <ul className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 py-3">
                    {!loading &&
                      comments.map((c) => (
                        <li key={c.id} className="max-w-full min-w-0 text-sm">
                          <span className="font-medium text-ink break-words">
                            {c.authorName}
                          </span>
                          <span className="ml-2 text-xs text-muted break-words">
                            {new Date(c.createdAt).toLocaleString("ko-KR")}
                          </span>
                          <p className="mt-1 whitespace-pre-wrap break-words font-emotional text-muted">
                            {c.content}
                          </p>
                        </li>
                      ))}
                    {!loading && comments.length === 0 ? (
                      <li className="text-sm text-muted">아직 댓글이 없어요.</li>
                    ) : null}
                  </ul>

                  <div className="flex min-w-0 gap-2 border-t border-line bg-surface px-3 py-2">
                    <textarea
                      ref={textareaRef}
                      placeholder="댓글을 입력하세요"
                      rows={2}
                      className="min-h-0 min-w-0 flex-1 resize-none overflow-x-hidden break-words rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void submitComment();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      className="shrink-0 self-end rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
                      onClick={() => void submitComment()}
                    >
                      등록
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </div>
      </div>
  );

  const imageModal = (
    <ImageViewerModal
      urls={post.imageUrls}
      index={imgIdx}
      open={viewerOpen}
      onClose={() => setViewerOpen(false)}
      onIndexChange={setImgIdx}
    />
  );

  if (isSide) {
    return createPortal(
      <>
        {panel}
        {imageModal}
      </>,
      document.body,
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      {panel}
      {imageModal}
    </div>
  );
}
