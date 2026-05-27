import { NextResponse } from "next/server";

import type { PinnedAnnouncementJson } from "@/lib/announcement";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.post.findMany({
      where: {
        kind: "ANNOUNCEMENT",
        visibleGroupIds: { isEmpty: true },
        feedPinned: true,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
    return NextResponse.json(rows satisfies PinnedAnnouncementJson[]);
  } catch (e) {
    console.error("[GET /api/announcements/pinned]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
