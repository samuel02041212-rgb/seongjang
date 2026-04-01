import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(
      posts.map((p) => ({
        _id: p.id,
        title: p.title,
        content: p.content,
        authorName: p.authorName,
        bibleRef: p.bibleRef,
        createdAt: p.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.error("[GET /api/admin/posts]", e);
    return NextResponse.json([], { status: 500 });
  }
}
