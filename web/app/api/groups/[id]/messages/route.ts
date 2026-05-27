import { NextResponse } from "next/server";
import { z } from "zod";

import {
  assertGroupMember,
  serializeGroupMessage,
} from "@/lib/group-room";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!(await assertGroupMember(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  try {
    const messages = await prisma.groupChatMessage.findMany({
      where: {
        groupId: id,
        ...(after ? { createdAt: { gt: new Date(after) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: after ? 100 : 200,
      include: {
        sender: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(
      messages.map((m) => serializeGroupMessage(m, session.user!.id)),
    );
  } catch (e) {
    console.error("[GET /api/groups/[id]/messages]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}

const postBody = z
  .object({
    kind: z.enum(["text", "image", "poll", "schedule"]).default("text"),
    content: z.string().trim().min(1).max(4000),
  })
  .refine((d) => d.kind !== "text" || d.content.length <= 500, {
    path: ["content"],
  });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!(await assertGroupMember(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  if (parsed.data.kind === "poll" || parsed.data.kind === "schedule") {
    try {
      JSON.parse(parsed.data.content);
    } catch {
      return NextResponse.json({ error: "bad" }, { status: 400 });
    }
  }

  try {
    const msg = await prisma.groupChatMessage.create({
      data: {
        groupId: id,
        senderId: session.user.id,
        kind: parsed.data.kind,
        content: parsed.data.content,
      },
      include: { sender: { select: { name: true, email: true } } },
    });

    return NextResponse.json(serializeGroupMessage(msg, session.user.id));
  } catch (e) {
    console.error("[POST /api/groups/[id]/messages]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
