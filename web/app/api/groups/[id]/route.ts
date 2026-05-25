import { NextResponse } from "next/server";
import { z } from "zod";

import { isGroupAdmin, serializeGroup } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  statusMessage: z.string().trim().max(80).optional(),
  image: z.string().url().nullable().optional(),
  description: z.string().trim().max(500).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const group = await prisma.smallGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId: id },
      },
    });
    if (!member && group.adminId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      serializeGroup(group, session.user.id, {
        isMember: !!member || group.adminId === session.user.id,
        joinStatus: member || group.adminId === session.user.id ? "member" : "none",
      }),
    );
  } catch (e) {
    console.error("[GET /api/groups/[id]]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!(await isGroupAdmin(session.user.id, id))) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const group = await prisma.smallGroup.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.statusMessage !== undefined
          ? { statusMessage: parsed.data.statusMessage }
          : {}),
        ...(parsed.data.image !== undefined ? { image: parsed.data.image } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      group: serializeGroup(group, session.user.id, {
        isMember: true,
        joinStatus: "member",
      }),
    });
  } catch (e) {
    console.error("[PATCH /api/groups/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
