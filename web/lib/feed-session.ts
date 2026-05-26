import type { FeedPostJson } from "@/lib/feed-serialize";

const BROWSE_KEY = "feedBrowse";

export type FeedBrowseState = {
  feedDate: string;
  scrollY: number;
  postId: string | null;
  detailPostId: string | null;
};

function scopeKey(groupId?: string) {
  return groupId ? `:g:${groupId}` : "";
}

function postsCacheKey(date: string, groupId?: string) {
  return `feedPosts:${date}${scopeKey(groupId)}`;
}

function browseKey(groupId?: string) {
  return `${BROWSE_KEY}${scopeKey(groupId)}`;
}

export function readFeedBrowse(groupId?: string): FeedBrowseState | null {
  try {
    const raw = sessionStorage.getItem(browseKey(groupId));
    if (!raw) return null;
    const v = JSON.parse(raw) as FeedBrowseState;
    if (typeof v.feedDate !== "string") return null;
    return {
      feedDate: v.feedDate,
      scrollY: typeof v.scrollY === "number" ? v.scrollY : 0,
      postId: typeof v.postId === "string" ? v.postId : null,
      detailPostId: typeof v.detailPostId === "string" ? v.detailPostId : null,
    };
  } catch {
    return null;
  }
}

export function saveFeedBrowse(state: FeedBrowseState, groupId?: string) {
  try {
    sessionStorage.setItem(browseKey(groupId), JSON.stringify(state));
  } catch {
    void 0;
  }
}

export function readFeedPostsCache(
  date: string,
  groupId?: string,
): FeedPostJson[] | null {
  try {
    const raw = sessionStorage.getItem(postsCacheKey(date, groupId));
    if (!raw) return null;
    const v = JSON.parse(raw) as FeedPostJson[];
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveFeedPostsCache(
  date: string,
  posts: FeedPostJson[],
  groupId?: string,
) {
  try {
    sessionStorage.setItem(postsCacheKey(date, groupId), JSON.stringify(posts));
  } catch {
    void 0;
  }
}
