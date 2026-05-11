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

  return (
    <article
      className="feed-post-card cursor-pointer rounded-xl border border-line bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-line/80 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff4d2] text-xs font-bold text-[#5c4d2c]"
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
                {formatFeedRelativeTime(post.createdAt)}
              </time>
            </div>
            {post.visibleGroupLabel ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="inline-flex max-w-full items-center rounded-md border border-line bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
                  {post.visibleGroupLabel}
                </span>
              </div>
            ) : null}
            {post.title ? (
              <h2 className="mt-2 text-[17px] font-bold leading-snug text-ink">
                {post.title}
              </h2>
            ) : null}
            {post.bibleRef ? (
              <p className="mt-2 text-xs font-medium text-muted">
                {post.bibleRef}
              </p>
            ) : null}
          </div>
        </div>

        {firstImg ? (
          <div className="mt-3 flex h-[146px] gap-1.5 overflow-hidden">
            {urls.slice(0, 4).map((url, i) => {
              const overflow =
                i === 3 && urls.length > 4 ? urls.length - 4 : 0;
              return (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-square h-full shrink-0 overflow-hidden rounded-md border border-line bg-bg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {overflow > 0 ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-lg font-bold text-white">
                      +{overflow}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 line-clamp-6 min-h-[146px] whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
            {post.content}
          </p>
        )}
      </div>

      <div
        className="flex gap-1 border-t border-line px-3 py-2.5 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
            post.isLikedByMe
              ? "text-red-600 hover:bg-red-50/10"
              : "text-muted hover:bg-bg"
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
        <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted">
          <span aria-hidden>💬</span>
          <span>댓글 {post.commentCount}</span>
        </span>
      </div>
    </article>
  );
}
