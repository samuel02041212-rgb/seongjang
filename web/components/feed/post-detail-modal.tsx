"use client";

import { useChatPanel } from "@/components/chat/chat-dock";
import {
  type FeedPostJson,
  formatFeedRelativeTime,
} from "@/lib/feed-serialize";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ImageViewerModal } from "./image-viewer-modal";

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

  useEffect(() => {
    setImgIdx(0);
    setViewerOpen(false);
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

  const panel = (
    <div
      className={
        isSide
          ? "fixed right-0 top-[var(--app-header-height)] bottom-0 flex w-[min(90.25vw,45.6rem)] flex-col overflow-hidden border-l border-line bg-surface shadow-xl"
          : "relative flex aspect-video w-[min(95vw,calc(95vh*16/9),80rem)] flex-col overflow-hidden rounded-2xl bg-surface shadow-xl"
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
        <div className="min-w-0 min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4d2] text-sm font-bold text-[#5c4d2c]"
              aria-hidden
            >
              {(post.authorName || "?").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                <span className="text-[15px] font-semibold text-ink">
                  {post.authorName}
                </span>
                <time
                  className="shrink-0 text-xs text-muted"
                  dateTime={post.createdAt}
                >
                  {formatFeedRelativeTime(post.createdAt)} ·{" "}
                  {new Date(post.createdAt).toLocaleString("ko-KR")}
                </time>
              </div>
              {post.visibleGroupLabel ? (
                <span className="mt-1.5 inline-flex rounded-md border border-line bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
                  {post.visibleGroupLabel}
                </span>
              ) : null}
              {post.title ? (
                <h3 className="mt-2 text-lg font-bold text-ink">
                  {post.title}
                </h3>
              ) : null}
              {post.bibleRef ? (
                <p className="mt-2 text-xs font-medium text-muted">
                  {post.bibleRef}
                </p>
              ) : null}
            </div>
          </div>

          {post.imageUrls.length > 0 ? (
            <div className="relative mt-4 h-64 overflow-hidden rounded-xl border border-line bg-bg">
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                aria-label="이미지 크게 보기"
                className="block h-full w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrls[imgIdx]}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </button>
              {post.imageUrls.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImgIdx(
                        (i) =>
                          (i - 1 + post.imageUrls.length) %
                          post.imageUrls.length,
                      )
                    }
                    aria-label="이전 이미지"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg font-bold text-white hover:bg-black/70"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImgIdx((i) => (i + 1) % post.imageUrls.length)
                    }
                    aria-label="다음 이미지"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg font-bold text-white hover:bg-black/70"
                  >
                    ›
                  </button>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
                    {imgIdx + 1} / {post.imageUrls.length}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.content}
          </div>
        </div>

        <div
          className={`flex min-w-0 shrink-0 flex-col overflow-x-hidden bg-bg ${
            isSide
              ? "h-[22.5rem] border-t border-line"
              : "w-[22rem] border-l border-line"
          }`}
        >
          <div className="border-b border-line px-4 py-2 text-sm font-semibold text-ink">
            댓글{" "}
            {previewMode
              ? post.commentCount
              : loading
                ? "…"
                : comments.length}
            개
          </div>

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
                      <p className="mt-1 whitespace-pre-wrap break-words text-muted">
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
                  className="min-h-0 min-w-0 flex-1 resize-none overflow-x-hidden break-words rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
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
