import { NextResponse } from "next/server";

import { serializeGroup } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [memberships, adminGroups] = await Promise.all([
      prisma.groupMember.findMany({
        where: { userId },
        include: { group: true },
        orderBy: { joinedAt: "asc" },
      }),
      prisma.smallGroup.findMany({
        where: { adminId: userId },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const byId = new Map<string, (typeof memberships)[0]["group"]>();
    for (const m of memberships) byId.set(m.group.id, m.group);
    for (const g of adminGroups) byId.set(g.id, g);

    return NextResponse.json(
      [...byId.values()].map((g) =>
        serializeGroup(g, userId, {
          isMember: true,
          joinStatus: "member",
        }),
      ),
    );
  } catch (e) {
    console.error("[GET /api/groups/mine]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
