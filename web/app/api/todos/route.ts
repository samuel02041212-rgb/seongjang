import { NextResponse } from "next/server";
import { z } from "zod";

import { isFeedDateIso } from "@/lib/feed-date";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim() || session.user.id;
  const date = searchParams.get("date")?.trim() || null;

  if (date && !isFeedDateIso(date)) {
    return NextResponse.json({ error: "bad_date" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { registrationApproved: true },
  });
  if (!user?.registrationApproved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const todos = await prisma.userTodo.findMany({
      where: {
        userId,
        ...(date ? { date } : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: { id: true, date: true, text: true, done: true },
    });
    return NextResponse.json(todos);
  } catch (e) {
    console.error("[GET /api/todos]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const createBody = z.object({
  text: z.string().trim().min(1),
  date: z.string().trim(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = createBody.safeParse(json);
  if (!parsed.success || !isFeedDateIso(parsed.data.date)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const todo = await prisma.userTodo.create({
      data: {
        userId: session.user.id,
        date: parsed.data.date,
        text: parsed.data.text,
      },
      select: { id: true, date: true, text: true, done: true },
    });
    return NextResponse.json(todo);
  } catch (e) {
    console.error("[POST /api/todos]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
