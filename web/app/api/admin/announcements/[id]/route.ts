import { NextResponse } from "next/server";
import { z } from "zod";

import { SITE_ANNOUNCEMENT_AUTHOR } from "@/lib/announcement";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const patchBody = z.object({
  feedPinned: z.boolean(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 403 });
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
    const updated = await prisma.post.updateMany({
      where: {
        id,
        kind: "ANNOUNCEMENT",
        visibleGroupIds: { isEmpty: true },
      },
      data: { feedPinned: parsed.data.feedPinned },
    });
    if (updated.count > 0) {
      return NextResponse.json({
        ok: true,
        feedPinned: parsed.data.feedPinned,
      });
    }

    const legacy = await prisma.post.updateMany({
      where: {
        id,
        kind: "MEDITATION",
        authorName: SITE_ANNOUNCEMENT_AUTHOR,
        visibleGroupIds: { isEmpty: true },
      },
      data: {
        feedPinned: parsed.data.feedPinned,
        kind: "ANNOUNCEMENT",
      },
    });
    if (legacy.count === 0) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      feedPinned: parsed.data.feedPinned,
    });
  } catch (e) {
    console.error("[PATCH /api/admin/announcements/[id]]", e);
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
    const post = await prisma.post.findFirst({
      where: { id, kind: "ANNOUNCEMENT", visibleGroupIds: { equals: [] } },
      select: { id: true },
    });
    if (!post) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/admin/announcements/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
