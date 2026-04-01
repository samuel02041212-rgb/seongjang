import { NextResponse } from "next/server";
import { z } from "zod";

import { clampScheduleRange } from "@/lib/admin-schedule-range";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET(req: Request) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const r = clampScheduleRange(searchParams.get("from"), searchParams.get("to"));
  if (!r.ok) return NextResponse.json([], { status: 400 });
  try {
    const events = await prisma.globalScheduleEvent.findMany({
      where: {
        startAt: { lt: r.toAt },
        endAt: { gt: r.fromAt },
      },
      orderBy: { startAt: "asc" },
    });
    return NextResponse.json(
      events.map((ev) => ({
        _id: ev.id,
        title: ev.title,
        description: ev.description,
        startAt: ev.startAt.toISOString(),
        endAt: ev.endAt.toISOString(),
        allDay: ev.allDay,
        color: ev.color,
      })),
    );
  } catch (e) {
    console.error("[GET /api/admin/schedule]", e);
    return NextResponse.json([], { status: 500 });
  }
}

const postBody = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  allDay: z.boolean().optional().default(false),
  color: z.string().optional().default("#ffcd38"),
});

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = postBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const s = new Date(parsed.data.startAt);
  const e = new Date(parsed.data.endAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e.getTime() < s.getTime()) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  try {
    const ev = await prisma.globalScheduleEvent.create({
      data: {
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        startAt: s,
        endAt: e,
        allDay: parsed.data.allDay,
        color: parsed.data.color || "#ffcd38",
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ ok: true, _id: ev.id });
  } catch (e) {
    console.error("[POST /api/admin/schedule]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
