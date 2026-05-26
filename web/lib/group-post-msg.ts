export type GroupPostMsgPayload = {
  postId: string;
  title: string;
  bibleRef: string;
  imageUrl: string | null;
};

export function postDisplayTitle(post: {
  title: string;
  bibleRef: string;
  content?: string;
}): string {
  const title = post.title.trim();
  if (title) return title;
  const ref = post.bibleRef.trim();
  if (ref) return ref;
  const text = post.content?.trim() ?? "";
  if (!text) return "말씀묵상";
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

export function buildGroupPostContent(post: {
  id: string;
  title: string;
  bibleRef: string;
  imageUrls: string[];
}): string {
  return JSON.stringify({
    postId: post.id,
    title: post.title.trim(),
    bibleRef: post.bibleRef.trim(),
    imageUrl: post.imageUrls[0] ?? null,
  } satisfies GroupPostMsgPayload);
}

export function parseGroupPostContent(content: string): GroupPostMsgPayload | null {
  try {
    const d = JSON.parse(content) as GroupPostMsgPayload;
    if (!d.postId || typeof d.postId !== "string") return null;
    return {
      postId: d.postId,
      title: d.title ?? "",
      bibleRef: d.bibleRef ?? "",
      imageUrl: d.imageUrl ?? null,
    };
  } catch {
    return null;
  }
}
