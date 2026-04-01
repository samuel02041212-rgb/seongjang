import type { Post as PostModel } from "@/app/generated/prisma/client";

export type FeedPostJson = {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  bibleRef: string;
  imageUrls: string[];
  likeCount: number;
  isLikedByMe: boolean;
  commentCount: number;
  /** 소그룹 공개 등 — 레거시 피드 상단 배지용 (목업/API에서 선택) */
  visibleGroupLabel?: string;
};

type PostWithCount = PostModel & {
  _count?: { comments: number };
};

export function serializeFeedPost(
  p: PostWithCount,
  myUserId: string,
): FeedPostJson {
  const likedBy = p.likedBy ?? [];
  return {
    id: p.id,
    title: p.title ?? "",
    content: p.content,
    authorName: p.authorName,
    createdAt: p.createdAt.toISOString(),
    bibleRef: p.bibleRef ?? "",
    imageUrls: normalizeImageUrls(p.imageUrls),
    likeCount: likedBy.length,
    isLikedByMe: likedBy.includes(myUserId),
    commentCount: p._count?.comments ?? 0,
  };
}

/** 레거시 imageUrl 단일 필드는 스키마에 없음 — API에서만 배열 사용 */
export function normalizeImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return [];
  return urls.map((u) => String(u ?? "").trim()).filter(Boolean);
}

/** 피드 카드·목록용 상대 시간 (레거시 타임라인과 유사) */
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
