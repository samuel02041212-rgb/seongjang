import { NextResponse } from "next/server";

import { groupMessagePreview } from "@/lib/group-room";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [memberships, adminGroups] = await Promise.all([
      prisma.groupMember.findMany({
        where: { userId },
        include: {
          group: { select: { id: true, name: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      }),
      prisma.smallGroup.findMany({
        where: { adminId: userId },
        select: { id: true, name: true, image: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const byId = new Map<
      string,
      { id: string; name: string; image: string | null }
    >();
    for (const m of memberships) byId.set(m.group.id, m.group);
    for (const g of adminGroups) byId.set(g.id, g);

    const groups = [...byId.values()];
    const groupIds = groups.map((g) => g.id);
    if (groupIds.length === 0) return NextResponse.json([]);

    const recent = await prisma.groupChatMessage.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: { createdAt: "desc" },
      take: Math.min(500, groupIds.length * 20),
      select: { groupId: true, kind: true, content: true, createdAt: true },
    });

    const lastByGroup = new Map<string, (typeof recent)[0]>();
    for (const msg of recent) {
      if (!lastByGroup.has(msg.groupId)) lastByGroup.set(msg.groupId, msg);
    }

    return NextResponse.json(
      groups.map((g) => {
        const last = lastByGroup.get(g.id);
        return {
          groupId: g.id,
          groupName: g.name,
          groupImage: g.image,
          preview: last
            ? groupMessagePreview(last.kind, last.content)
            : "대화를 시작하세요.",
          lastMessageAt: last?.createdAt.toISOString() ?? null,
        };
      }),
    );
  } catch (e) {
    console.error("[GET /api/chat/group-rooms]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
