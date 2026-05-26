import { NextResponse } from "next/server";

import { serializeFeedPost } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        _count: { select: { comments: true } },
        author: { select: { church: true } },
      },
    });
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const bookmarks = await prisma.postBookmark.findMany({
      where: { userId: session.user.id, postId: id },
      select: { folderId: true },
    });

    return NextResponse.json(
      serializeFeedPost(post, session.user.id, {
        bookmarkFolderIds: bookmarks.map((b) => b.folderId),
      }),
    );
  } catch (e) {
    console.error("[GET /api/posts/[id]]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
