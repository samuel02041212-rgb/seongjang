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

    await prisma.groupCreationRequest.update({
      where: { id },
      data: {
        status: "rejected",
        reviewedAt: new Date(),
        reviewedById: session.user!.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST group-creation reject]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
