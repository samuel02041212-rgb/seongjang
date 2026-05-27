import { NextResponse } from "next/server";
import { z } from "zod";

import { isGroupAdmin } from "@/lib/group";
import { normalizeImageUrls } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const createBody = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  imageUrls: z.array(z.string()).max(20).optional().default([]),
  imagesLarge: z.boolean().optional().default(false),
});

function serialize(p: {
  id: string;
  title: string;
  content: string;
  authorName: string;
  imageUrls: string[];
  imagesLarge: boolean;
  createdAt: Date;
}) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    authorName: p.authorName,
    imageUrls: p.imageUrls,
    imagesLarge: p.imagesLarge,
    feedPinned: false,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, groupId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await prisma.post.findMany({
      where: {
        kind: "ANNOUNCEMENT",
        visibleGroupIds: { has: groupId },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(rows.map(serialize));
  } catch (e) {
    console.error("[GET /api/groups/[id]/announcements]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id: groupId } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, groupId))) {
    return NextResponse.json({ ok: false }, { status: 403 });
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
    const group = await prisma.smallGroup.findUnique({
      where: { id: groupId },
      select: { name: true },
    });
    if (!group) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const imageUrls = normalizeImageUrls(parsed.data.imageUrls);
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        authorName: group.name,
        title: parsed.data.title,
        content: parsed.data.content,
        bibleRef: "",
        kind: "ANNOUNCEMENT",
        imageUrls,
        imagesLarge: parsed.data.imagesLarge && imageUrls.length > 0,
        visibleGroupIds: [groupId],
      },
    });
    return NextResponse.json({ ok: true, id: post.id });
  } catch (e) {
    console.error("[POST /api/groups/[id]/announcements]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
