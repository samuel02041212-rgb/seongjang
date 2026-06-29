import { NextResponse } from "next/server";

import { computeUserReadingStatus } from "@/lib/bible-reading-progress";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { registrationApproved: true },
  });
  if (!user?.registrationApproved) {
    return NextResponse.json(null, { status: 404 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: { authorId: id, kind: "MEDITATION" },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        bibleRef: true,
        bibleReadingRanges: true,
        bibleBookKey: true,
        bibleChapterStart: true,
        bibleVerseStart: true,
        bibleChapterEnd: true,
        bibleVerseEnd: true,
      },
    });

    return NextResponse.json(computeUserReadingStatus(posts));
  } catch (e) {
    console.error("[GET /api/users/[id]/reading-status]", e);
    return NextResponse.json(null, { status: 503 });
  }
}
