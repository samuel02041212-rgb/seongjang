import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/server-auth";
import { serializeFeedPost } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { _count: { select: { comments: true } } },
    });

    const normalized = posts.map((p) =>
      serializeFeedPost(p, session.user!.id),
    );
    return NextResponse.json(normalized);
  } catch (e) {
    console.error("[GET /api/posts]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const createBody = z.object({
  title: z.string().optional().default(""),
  content: z.string().min(1, "내용을 입력해 주세요."),
  bibleRef: z.string().optional().default(""),
  imageUrls: z.array(z.string().min(1)).max(20).optional().default([]),
  visibleGroupIds: z.array(z.string()).optional().default([]),
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  const authorName = user?.name?.trim() || user?.email || "사용자";

  try {
    await prisma.post.create({
      data: {
        authorId: session.user.id,
        authorName,
        title: parsed.data.title,
        content: parsed.data.content,
        bibleRef: parsed.data.bibleRef,
        imageUrls: parsed.data.imageUrls,
        visibleGroupIds: parsed.data.visibleGroupIds,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/posts]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
