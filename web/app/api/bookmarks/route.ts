import { NextResponse } from "next/server";
import { z } from "zod";

import { serializeFeedPost } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = new URL(req.url).searchParams.get("folderId");
  if (!folderId) {
    return NextResponse.json({ error: "bad_folder" }, { status: 400 });
  }

  try {
    if (folderId === "all") {
      const bookmarks = await prisma.postBookmark.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            include: {
              _count: { select: { comments: true } },
              author: { select: { church: true } },
            },
          },
        },
      });

      const seen = new Set<string>();
      const unique = bookmarks.filter((b) => {
        if (seen.has(b.postId)) return false;
        seen.add(b.postId);
        return true;
      });

      const postIds = unique.map((b) => b.postId);
      const allFolderIds =
        postIds.length > 0
          ? await prisma.postBookmark.findMany({
              where: {
                userId: session.user.id,
                postId: { in: postIds },
              },
              select: { postId: true, folderId: true },
            })
          : [];
      const bookmarkMap = new Map<string, string[]>();
      for (const b of allFolderIds) {
        const list = bookmarkMap.get(b.postId) ?? [];
        list.push(b.folderId);
        bookmarkMap.set(b.postId, list);
      }

      return NextResponse.json(
        unique.map((b) =>
          serializeFeedPost(b.post, session.user!.id, {
            bookmarkFolderIds: bookmarkMap.get(b.postId) ?? [],
          }),
        ),
      );
    }

    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id: folderId, userId: session.user.id },
    });
    if (!folder) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const bookmarks = await prisma.postBookmark.findMany({
      where: { userId: session.user.id, folderId },
      orderBy: { createdAt: "desc" },
      include: {
        post: {
          include: {
            _count: { select: { comments: true } },
            author: { select: { church: true } },
          },
        },
      },
    });

    const allFolderIds = await prisma.postBookmark.findMany({
      where: {
        userId: session.user.id,
        postId: { in: bookmarks.map((b) => b.postId) },
      },
      select: { postId: true, folderId: true },
    });
    const bookmarkMap = new Map<string, string[]>();
    for (const b of allFolderIds) {
      const list = bookmarkMap.get(b.postId) ?? [];
      list.push(b.folderId);
      bookmarkMap.set(b.postId, list);
    }

    return NextResponse.json(
      bookmarks.map((b) =>
        serializeFeedPost(b.post, session.user!.id, {
          bookmarkFolderIds: bookmarkMap.get(b.postId) ?? [],
        }),
      ),
    );
  } catch (e) {
    console.error("[GET /api/bookmarks]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const createBody = z.object({
  postId: z.string().min(1),
  folderId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id: parsed.data.folderId, userId: session.user.id },
    });
    if (!folder) return NextResponse.json({ ok: false }, { status: 404 });

    const post = await prisma.post.findUnique({
      where: { id: parsed.data.postId },
    });
    if (!post) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.postBookmark.upsert({
      where: {
        userId_postId_folderId: {
          userId: session.user.id,
          postId: parsed.data.postId,
          folderId: parsed.data.folderId,
        },
      },
      create: {
        userId: session.user.id,
        postId: parsed.data.postId,
        folderId: parsed.data.folderId,
      },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/bookmarks]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const folderId = searchParams.get("folderId");
  if (!postId || !folderId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.postBookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId,
        folderId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/bookmarks]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
