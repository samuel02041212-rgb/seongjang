"use client";

import {
  cardInnerClass,
  cardShellClass,
  feedCardSizeClass,
} from "@/lib/feed-card-layout";
import {
  feedPostBodyAreaClass,
  feedPostBodyTextClass,
  feedPostBibleRefClass,
  feedPostFooterClass,
  feedPostInnerClass,
  feedPostTitleClass,
} from "@/lib/feed-post-body-layout";
import { FeedPostImages } from "@/components/feed/feed-post-images";
import { PostBookmarkButton } from "@/components/feed/post-bookmark-button";
import {
  type FeedPostJson,
  formatFeedRelativeTime,
} from "@/lib/feed-serialize";

type FeedPostRowProps = {
  post: FeedPostJson;
  onOpenDetail: (post: FeedPostJson) => void;
  onLike: (postId: string) => void;
  likePending?: boolean;
  showBookmark?: boolean;
  onBookmarkChange?: (postId: string, folderIds: string[]) => void;
};

export function FeedPostRow({
  post,
  onOpenDetail,
  onLike,
  likePending,
  showBookmark,
  onBookmarkChange,
}: FeedPostRowProps) {
  return (
    <div className={`group/card ${cardShellClass} bg-gradient-to-br from-accent/40 via-line to-accent/20 p-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:from-accent/60 hover:to-accent/40 hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)] dark:from-accent/25 dark:via-line dark:to-accent/10 dark:hover:from-accent/40 dark:hover:to-accent/25`}>
    <article
      className={`feed-post-card flex cursor-pointer flex-col overflow-hidden ${cardInnerClass} bg-surface ${feedCardSizeClass}`}
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
      <div className={feedPostInnerClass}>
        <div className="flex items-start justify-between gap-x-2 gap-y-1">
          <div className="min-w-0 flex-1">
            {post.title ? (
              <h2 className={feedPostTitleClass}>
                {post.title}
              </h2>
            ) : null}
            {post.bibleRef ? (
              <p
                className={`${feedPostBibleRefClass} ${post.title ? "mt-1" : ""}`}
              >
                {post.bibleRef}
              </p>
            ) : null}
          </div>
          {post.authorName || post.authorChurch ? (
            <span className="max-w-[45%] shrink-0 truncate text-right text-xs text-muted">
              {post.authorName}
              {post.authorChurch ? `, ${post.authorChurch}` : ""}
            </span>
          ) : null}
        </div>
        {post.visibleGroupLabel ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex max-w-full items-center rounded-md border border-line bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
              {post.visibleGroupLabel}
            </span>
          </div>
        ) : null}

        <FeedPostImages
          urls={post.imageUrls}
          large={post.imagesLarge}
          cardPreview
        />
        <div className={feedPostBodyAreaClass}>
          <p className={feedPostBodyTextClass}>
            {post.content}
          </p>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
        </div>
      </div>

      <div
        className={feedPostFooterClass}
        onClick={(e) => e.stopPropagation()}
      >
        <time className="shrink-0 text-xs text-muted" dateTime={post.createdAt}>
          {formatFeedRelativeTime(post.createdAt)}
        </time>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-muted">
            <span>댓글</span>
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
          </span>
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
          {showBookmark && onBookmarkChange ? (
            <PostBookmarkButton
              postId={post.id}
              folderIds={post.bookmarkFolderIds ?? []}
              onChange={(folderIds) => onBookmarkChange(post.id, folderIds)}
            />
          ) : null}
        </div>
      </div>
    </article>
    </div>
  );
}
