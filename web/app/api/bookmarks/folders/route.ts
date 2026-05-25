import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const folders = await prisma.bookmarkFolder.findMany({
      where: { userId: session.user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { bookmarks: true } } },
    });
    const distinct = await prisma.postBookmark.findMany({
      where: { userId: session.user.id },
      distinct: ["postId"],
      select: { postId: true },
    });
    return NextResponse.json({
      folders: folders.map((f) => ({
        id: f.id,
        name: f.name,
        sortOrder: f.sortOrder,
        count: f._count.bookmarks,
      })),
      allCount: distinct.length,
    });
  } catch (e) {
    console.error("[GET /api/bookmarks/folders]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const createBody = z.object({
  name: z.string().trim().min(1).max(40),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_body" }, { status: 400 });
  }

  try {
    const max = await prisma.bookmarkFolder.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });
    const folder = await prisma.bookmarkFolder.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      sortOrder: folder.sortOrder,
      count: 0,
    });
  } catch (e) {
    console.error("[POST /api/bookmarks/folders]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
