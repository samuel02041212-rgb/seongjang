import { NextResponse } from "next/server";

import { serializeGroup } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  try {
    const groups = await prisma.smallGroup.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { name: "asc" },
      take: 30,
    });

    const groupIds = groups.map((g) => g.id);
    const [memberships, joinReqs] = await Promise.all([
      prisma.groupMember.findMany({
        where: { userId: session.user.id, groupId: { in: groupIds } },
        select: { groupId: true },
      }),
      prisma.groupJoinRequest.findMany({
        where: { userId: session.user.id, groupId: { in: groupIds } },
        select: { groupId: true, status: true },
      }),
    ]);
    const memberSet = new Set(memberships.map((m) => m.groupId));
    const joinMap = new Map(joinReqs.map((j) => [j.groupId, j.status]));

    return NextResponse.json(
      groups.map((g) =>
        serializeGroup(g, session.user!.id, {
          isMember: memberSet.has(g.id),
          joinStatus: memberSet.has(g.id)
            ? "member"
            : joinMap.get(g.id) === "pending"
              ? "pending"
              : "none",
        }),
      ),
    );
  } catch (e) {
    console.error("[GET /api/groups]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
