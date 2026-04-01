import { NextResponse } from "next/server";
import { auth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id: postId } = await context.params;
  const userId = session.user.id;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const likedBy = [...post.likedBy];
    const has = likedBy.includes(userId);
    const next = has
      ? likedBy.filter((x) => x !== userId)
      : [...likedBy, userId];

    await prisma.post.update({
      where: { id: postId },
      data: { likedBy: next },
    });

    return NextResponse.json({
      ok: true,
      liked: !has,
      likeCount: next.length,
    });
  } catch (e) {
    console.error("[POST like]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
