import { NextResponse } from "next/server";

import { isGroupAdmin } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; reqId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id, reqId } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, id))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const row = await prisma.groupJoinRequest.findFirst({
      where: { id: reqId, groupId: id, status: "pending" },
    });
    if (!row) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.groupMember.upsert({
        where: {
          userId_groupId: { userId: row.userId, groupId: id },
        },
        create: { userId: row.userId, groupId: id },
        update: {},
      }),
      prisma.groupJoinRequest.update({
        where: { id: reqId },
        data: { status: "approved", reviewedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST join-requests approve]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
