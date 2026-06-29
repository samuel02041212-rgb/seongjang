import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

type RouteCtx = { params: Promise<{ id: string }> };

const patchBody = z.object({
  done: z.boolean(),
});

export async function PATCH(req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const existing = await prisma.userTodo.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const todo = await prisma.userTodo.update({
      where: { id },
      data: { done: parsed.data.done },
      select: { id: true, date: true, text: true, done: true },
    });
    return NextResponse.json(todo);
  } catch (e) {
    console.error("[PATCH /api/todos/[id]]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
