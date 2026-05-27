import { NextResponse } from "next/server";
import { z } from "zod";

import { SITE_ANNOUNCEMENT_AUTHOR } from "@/lib/announcement";
import { normalizeImageUrls } from "@/lib/feed-serialize";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

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
  feedPinned: boolean;
  createdAt: Date;
}) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    authorName: p.authorName,
    imageUrls: p.imageUrls,
    imagesLarge: p.imagesLarge,
    feedPinned: p.feedPinned,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const rows = await prisma.post.findMany({
      where: {
        visibleGroupIds: { isEmpty: true },
        OR: [
          { kind: "ANNOUNCEMENT" },
          { kind: "MEDITATION", authorName: SITE_ANNOUNCEMENT_AUTHOR },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json(rows.map(serialize));
  } catch (e) {
    console.error("[GET /api/admin/announcements]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
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
    const imageUrls = normalizeImageUrls(parsed.data.imageUrls);
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        authorName: SITE_ANNOUNCEMENT_AUTHOR,
        title: parsed.data.title,
        content: parsed.data.content,
        bibleRef: "",
        kind: "ANNOUNCEMENT",
        imageUrls,
        imagesLarge: parsed.data.imagesLarge && imageUrls.length > 0,
        visibleGroupIds: [],
      },
    });
    return NextResponse.json({ ok: true, id: post.id });
  } catch (e) {
    console.error("[POST /api/admin/announcements]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
