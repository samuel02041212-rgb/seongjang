import { NextResponse } from "next/server";

import { isGroupAdmin } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await prisma.groupJoinRequest.findMany({
      where: { groupId: id, status: "pending" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, church: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        user: {
          id: r.user.id,
          name: r.user.name?.trim() || r.user.email.split("@")[0] || "회원",
          image: r.user.image,
          church: r.user.church,
        },
      })),
    );
  } catch (e) {
    console.error("[GET /api/groups/[id]/join-requests]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
