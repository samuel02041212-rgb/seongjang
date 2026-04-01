"use client";

import {
  type FeedPostJson,
  formatFeedRelativeTime,
} from "@/lib/feed-serialize";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** true면 API 호출 없이 UI만 (댓글 입력 비활성) */
  previewMode?: boolean;
};

export function PostDetailModal({
  post,
  open,
  onClose,
  onCommentAdded,
  previewMode = false,
}: PostDetailModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-surface shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-detail-title"
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eee8e0] bg-[#fff8e8] text-sm font-bold text-[#5c4d2c]"
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
                <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-accent/35 bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
                  <span aria-hidden>📖</span>
                  {post.bibleRef}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.content}
          </div>

          {post.imageUrls.length > 0 ? (
            <div className="mt-4 space-y-2">
              {post.imageUrls.map((url) => (
                <div
                  key={url}
                  className="overflow-hidden rounded-xl border border-[#eee] bg-[#f5f3ef]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="max-h-80 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 border-t border-line pt-4">
            <h4 className="text-sm font-semibold text-ink">
              댓글{" "}
              {previewMode
                ? post.commentCount
                : loading
                  ? "…"
                  : comments.length}
              개
            </h4>

            {previewMode ? (
              <p className="mt-3 text-sm text-muted">
                미리보기 모드에서는 댓글 목록·작성이 비활성화됩니다.
              </p>
            ) : (
              <>
                <ul className="mt-3 space-y-3">
                  {!loading &&
                    comments.map((c) => (
                      <li key={c.id} className="text-sm">
                        <span className="font-medium text-ink">
                          {c.authorName}
                        </span>
                        <span className="ml-2 text-xs text-muted">
                          {new Date(c.createdAt).toLocaleString("ko-KR")}
                        </span>
                        <p className="mt-1 whitespace-pre-wrap text-muted">
                          {c.content}
                        </p>
                      </li>
                    ))}
                  {!loading && comments.length === 0 ? (
                    <li className="text-sm text-muted">
                      아직 댓글이 없어요.
                    </li>
                  ) : null}
                </ul>

                <div className="mt-4 flex gap-2">
                  <textarea
                    ref={textareaRef}
                    placeholder="댓글을 입력하세요"
                    rows={2}
                    className="min-w-0 flex-1 resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink outline-none ring-accent/30 focus:ring-2"
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
    </div>
  );
}
