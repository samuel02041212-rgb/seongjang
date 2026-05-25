import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const patchBody = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!folder) return NextResponse.json({ ok: false }, { status: 404 });

    const updated = await prisma.bookmarkFolder.update({
      where: { id },
      data: {
        ...(parsed.data.name != null ? { name: parsed.data.name } : {}),
        ...(parsed.data.sortOrder != null
          ? { sortOrder: parsed.data.sortOrder }
          : {}),
      },
    });
    return NextResponse.json({
      ok: true,
      id: updated.id,
      name: updated.name,
      sortOrder: updated.sortOrder,
    });
  } catch (e) {
    console.error("[PATCH /api/bookmarks/folders/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!folder) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.bookmarkFolder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/bookmarks/folders/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
