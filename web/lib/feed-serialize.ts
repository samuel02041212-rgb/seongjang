import type { Post as PostModel } from "@/app/generated/prisma/client";

export type FeedPostJson = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorChurch?: string;
  createdAt: string;
  bibleRef: string;
  imageUrls: string[];
  imagesLarge: boolean;
  likeCount: number;
  isLikedByMe: boolean;
  commentCount: number;
  visibleGroupLabel?: string;
  bookmarkFolderIds: string[];
};

type PostWithCount = PostModel & {
  _count?: { comments: number };
  author?: { church: string };
};

export function serializeFeedPost(
  p: PostWithCount,
  myUserId: string,
  opts?: { bookmarkFolderIds?: string[] },
): FeedPostJson {
  const likedBy = p.likedBy ?? [];
  return {
    id: p.id,
    title: p.title ?? "",
    content: p.content,
    authorName: p.authorName,
    authorChurch: p.author?.church?.trim() || undefined,
    createdAt: p.createdAt.toISOString(),
    bibleRef: p.bibleRef ?? "",
    imageUrls: normalizeImageUrls(p.imageUrls),
    imagesLarge: p.imagesLarge ?? false,
    likeCount: likedBy.length,
    isLikedByMe: likedBy.includes(myUserId),
    commentCount: p._count?.comments ?? 0,
    bookmarkFolderIds: opts?.bookmarkFolderIds ?? [],
  };
}

export function normalizeImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => String(u ?? "").trim()).filter(Boolean);
}

export function formatFeedRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
