import { NextResponse } from "next/server";
import { z } from "zod";

import { assertGroupMember } from "@/lib/group-room";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const bodySchema = z.object({
  optionIndex: z.number().int().min(0).max(20),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; msgId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id, msgId } = await ctx.params;
  if (!(await assertGroupMember(session.user.id, id))) {
    return NextResponse.json({ ok: false }, { status: 403 });
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

  try {
    const msg = await prisma.groupChatMessage.findFirst({
      where: { id: msgId, groupId: id, kind: "poll" },
    });
    if (!msg) return NextResponse.json({ ok: false }, { status: 404 });

    const data = JSON.parse(msg.content) as {
      question: string;
      options: string[];
      votes?: Record<string, number>;
    };
    if (
      parsed.data.optionIndex < 0 ||
      parsed.data.optionIndex >= data.options.length
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const votes = { ...(data.votes ?? {}) };
    votes[session.user.id] = parsed.data.optionIndex;
    const next = JSON.stringify({ ...data, votes });

    await prisma.groupChatMessage.update({
      where: { id: msgId },
      data: { content: next },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST poll vote]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
