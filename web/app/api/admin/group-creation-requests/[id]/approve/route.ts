import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    const row = await prisma.groupCreationRequest.findFirst({
      where: { id, status: "pending" },
    });
    if (!row) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const group = await tx.smallGroup.create({
        data: {
          name: row.name,
          description: row.description,
          image: row.image,
          adminId: row.requesterId,
        },
      });
      await tx.groupMember.create({
        data: { userId: row.requesterId, groupId: group.id },
      });
      await tx.groupCreationRequest.update({
        where: { id },
        data: {
          status: "approved",
          reviewedAt: new Date(),
          reviewedById: session.user!.id,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST group-creation approve]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
