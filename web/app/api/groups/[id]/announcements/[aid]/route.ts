import { NextResponse } from "next/server";

import { isGroupAdmin } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; aid: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id: groupId, aid } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, groupId))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const post = await prisma.post.findFirst({
      where: {
        id: aid,
        kind: "ANNOUNCEMENT",
        visibleGroupIds: { has: groupId },
      },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    await prisma.post.delete({ where: { id: aid } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/groups/[id]/announcements/[aid]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
