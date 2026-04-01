"use client";

import {
  type FeedPostJson,
  formatFeedRelativeTime,
} from "@/lib/feed-serialize";

type FeedPostRowProps = {
  post: FeedPostJson;
  onOpenDetail: (post: FeedPostJson) => void;
  onLike: (postId: string) => void;
  likePending?: boolean;
};

export function FeedPostRow({
  post,
  onOpenDetail,
  onLike,
  likePending,
}: FeedPostRowProps) {
  const urls = post.imageUrls;
  const firstImg = urls[0];
  const extra = urls.length > 1 ? urls.length - 1 : 0;

  return (
    <article
      className="feed-post-card cursor-pointer rounded-xl border border-[#e8e4df] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-[#ddd8d0] hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetail(post)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail(post);
        }
      }}
    >
      <div className="px-4 pb-3 pt-4 sm:px-5">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#eee8e0] bg-[#fff8e8] text-sm font-bold text-[#5c4d2c]"
            aria-hidden
          >
            {(post.authorName || "?").slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
              <span className="text-[15px] font-semibold text-[#222]">
                {post.authorName}
              </span>
              <time
                className="shrink-0 text-xs text-[#8a8580]"
                dateTime={post.createdAt}
              >
                {formatFeedRelativeTime(post.createdAt)}
              </time>
            </div>
            {post.visibleGroupLabel ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex max-w-full items-center rounded-md border border-[#e5e0d8] bg-[#faf8f5] px-2 py-0.5 text-[11px] font-medium text-[#6b6560]">
                  {post.visibleGroupLabel}
                </span>
              </div>
            ) : null}
            {post.title ? (
              <h2 className="mt-2 text-[17px] font-bold leading-snug text-[#1a1a1a]">
                {post.title}
              </h2>
            ) : null}
            {post.bibleRef ? (
              <div className="mt-2 inline-flex items-center gap-1 rounded-lg border border-accent/35 bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-foreground">
                <span aria-hidden>📖</span>
                {post.bibleRef}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-[15px] leading-relaxed text-[#333]">
          {post.content}
        </p>

        {firstImg ? (
          <div className="relative mt-3 overflow-hidden rounded-lg border border-[#eee] bg-[#f5f3ef]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstImg}
              alt=""
              className="max-h-64 w-full object-cover"
            />
            {extra > 0 ? (
              <span className="absolute bottom-2 right-2 rounded-full bg-[#1a1a1a]/80 px-2 py-0.5 text-xs font-semibold text-white">
                +{extra}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className="flex gap-1 border-t border-[#eee] px-3 py-2.5 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
            post.isLikedByMe
              ? "text-red-600 hover:bg-red-50"
              : "text-[#666] hover:bg-[#f8f6f3]"
          }`}
          disabled={likePending}
          aria-pressed={post.isLikedByMe}
          aria-label="공감"
          onClick={() => onLike(post.id)}
        >
          <span aria-hidden className="text-base">
            {post.isLikedByMe ? "♥" : "♡"}
          </span>
          <span>공감 {post.likeCount}</span>
        </button>
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-[#888]">
          <span aria-hidden>💬</span>
          <span>댓글 {post.commentCount}</span>
        </span>
      </div>
    </article>
  );
}
