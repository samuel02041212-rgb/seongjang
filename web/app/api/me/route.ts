import { NextResponse } from "next/server";
import { z } from "zod";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
      church: true,
      statusMessage: true,
    },
  });
  if (!me) return NextResponse.json(null, { status: 401 });
  return NextResponse.json({
    id: me.id,
    name: me.name,
    church: me.church ?? "",
    statusMessage: me.statusMessage ?? "",
    image: me.image,
    role:
      me.email === ADMIN_USER_EMAIL || me.isAdmin ? "admin" : "user",
  });
}

const patchBody = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  image: z.string().trim().max(2000).nullable().optional(),
  statusMessage: z.string().trim().max(80).optional(),
});

export async function PATCH(req: Request) {
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
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const data: {
    name?: string;
    image?: string | null;
    statusMessage?: string;
  } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.image !== undefined) {
    data.image = parsed.data.image ? parsed.data.image : null;
  }
  if (parsed.data.statusMessage !== undefined) {
    data.statusMessage = parsed.data.statusMessage;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true });
  }
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/me]", e);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
