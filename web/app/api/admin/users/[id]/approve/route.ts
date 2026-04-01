import { NextResponse } from "next/server";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, registrationApproved: true },
    });
    if (!user) return NextResponse.json({ ok: false }, { status: 404 });
    if (user.email === ADMIN_USER_EMAIL) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await prisma.user.update({
      where: { id },
      data: { registrationApproved: true },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/admin/users/.../approve]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
