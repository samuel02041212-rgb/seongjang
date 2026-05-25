import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const bodySchema = z.object({
  groupId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userId = session.user.id;
  const { groupId } = parsed.data;

  try {
    const group = await prisma.smallGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (member) {
      return NextResponse.json(
        { ok: false, message: "이미 가입한 소그룹입니다." },
        { status: 409 },
      );
    }

    const existing = await prisma.groupJoinRequest.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (existing?.status === "pending") {
      return NextResponse.json(
        { ok: false, message: "승인 대기 중입니다." },
        { status: 409 },
      );
    }

    if (existing) {
      await prisma.groupJoinRequest.update({
        where: { id: existing.id },
        data: { status: "pending", reviewedAt: null },
      });
    } else {
      await prisma.groupJoinRequest.create({
        data: { userId, groupId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/groups/join-requests]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
