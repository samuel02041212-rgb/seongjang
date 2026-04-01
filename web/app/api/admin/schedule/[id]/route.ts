import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

const putBody = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  allDay: z.boolean().optional(),
  color: z.string().optional(),
});

export async function PUT(
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
  const parsed = putBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const ev = await prisma.globalScheduleEvent.findUnique({ where: { id } });
    if (!ev) return NextResponse.json({ ok: false }, { status: 404 });

    const nextTitle = parsed.data.title != null ? parsed.data.title.trim() : ev.title;
    const nextDesc =
      parsed.data.description != null
        ? parsed.data.description.trim()
        : ev.description;
    const nextStart =
      parsed.data.startAt != null ? new Date(parsed.data.startAt) : ev.startAt;
    const nextEnd =
      parsed.data.endAt != null ? new Date(parsed.data.endAt) : ev.endAt;
    const nextAllDay =
      parsed.data.allDay != null ? parsed.data.allDay : ev.allDay;
    const nextColor =
      parsed.data.color != null ? String(parsed.data.color) : ev.color;

    if (
      Number.isNaN(nextStart.getTime()) ||
      Number.isNaN(nextEnd.getTime()) ||
      nextEnd.getTime() < nextStart.getTime()
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await prisma.globalScheduleEvent.update({
      where: { id },
      data: {
        title: nextTitle,
        description: nextDesc,
        startAt: nextStart,
        endAt: nextEnd,
        allDay: nextAllDay,
        color: nextColor,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/admin/schedule/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
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
    await prisma.globalScheduleEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
}
