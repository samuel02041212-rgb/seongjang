import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().trim().max(500).optional(),
  image: z.string().url().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
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
    const pending = await prisma.groupCreationRequest.findFirst({
      where: { requesterId: session.user.id, status: "pending" },
    });
    if (pending) {
      return NextResponse.json(
        { ok: false, message: "이미 검토 중인 개설 요청이 있습니다." },
        { status: 409 },
      );
    }

    await prisma.groupCreationRequest.create({
      data: {
        requesterId: session.user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        image: parsed.data.image ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/groups/creation-requests]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
