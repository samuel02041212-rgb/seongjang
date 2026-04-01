import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await context.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.error("[GET comments]", e);
    return NextResponse.json([], { status: 500 });
  }
}

const commentBody = z.object({
  content: z.string().trim().min(1),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id: postId } = await context.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = commentBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  const authorName = user?.name?.trim() || user?.email || "사용자";

  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: session.user.id,
        authorName,
        content: parsed.data.content,
      },
    });
    return NextResponse.json({ ok: true, comment }, { status: 201 });
  } catch (e) {
    console.error("[POST comment]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
