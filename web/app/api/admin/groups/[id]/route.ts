import { NextResponse } from "next/server";
import { z } from "zod";

import { serializeGroup } from "@/lib/group";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  statusMessage: z.string().trim().max(80).optional(),
  image: z.string().url().nullable().optional(),
  description: z.string().trim().max(500).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { id } = await ctx.params;

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
        isMember: false,
        joinStatus: "none",
      }),
    });
  } catch (e) {
    console.error("[PATCH /api/admin/groups/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.smallGroup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/groups/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
