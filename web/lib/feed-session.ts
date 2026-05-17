import type { FeedPostJson } from "@/lib/feed-serialize";

const BROWSE_KEY = "feedBrowse";

export type FeedBrowseState = {
  feedDate: string;
  scrollY: number;
  postId: string | null;
  detailPostId: string | null;
};

function postsCacheKey(date: string) {
  return `feedPosts:${date}`;
}

export function readFeedBrowse(): FeedBrowseState | null {
  try {
    const raw = sessionStorage.getItem(BROWSE_KEY);
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

export function saveFeedBrowse(state: FeedBrowseState) {
  try {
    sessionStorage.setItem(BROWSE_KEY, JSON.stringify(state));
  } catch {
    void 0;
  }
}

export function readFeedPostsCache(date: string): FeedPostJson[] | null {
  try {
    const raw = sessionStorage.getItem(postsCacheKey(date));
    if (!raw) return null;
    const v = JSON.parse(raw) as FeedPostJson[];
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveFeedPostsCache(date: string, posts: FeedPostJson[]) {
  try {
    sessionStorage.setItem(postsCacheKey(date), JSON.stringify(posts));
  } catch {
    void 0;
  }
}
