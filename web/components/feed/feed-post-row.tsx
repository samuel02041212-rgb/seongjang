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
    <div className="group/card rounded-xl bg-gradient-to-br from-accent/40 via-line to-accent/20 p-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:from-accent/60 hover:to-accent/40 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:from-accent/25 dark:via-line dark:to-accent/10 dark:hover:from-accent/40 dark:hover:to-accent/25">
    <article
      className="feed-post-card flex aspect-[3/4] cursor-pointer flex-col overflow-hidden rounded-[10px] bg-surface"
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
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-4 sm:px-5">
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
              <h2 className="mt-2 font-display text-[17px] leading-snug text-ink">
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
        ) : null}
        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
          <p className="whitespace-pre-wrap font-emotional text-[15px] leading-relaxed text-ink">
            {post.content}
          </p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
        </div>
      </div>

      <div
        className="ml-auto flex items-center gap-3 px-4 py-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`inline-flex items-center gap-1 text-sm font-semibold transition ${
            post.isLikedByMe
              ? "text-red-600"
              : "text-muted hover:text-ink"
          }`}
          disabled={likePending}
          aria-pressed={post.isLikedByMe}
          aria-label="공감"
          onClick={() => onLike(post.id)}
        >
          <span aria-hidden>{post.isLikedByMe ? "♥" : "♡"}</span>
          {post.likeCount > 0 && <span>{post.likeCount}</span>}
        </button>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-muted">
          <span>댓글</span>
          {post.commentCount > 0 && <span>{post.commentCount}</span>}
        </span>
      </div>
    </article>
    </div>
  );
}
