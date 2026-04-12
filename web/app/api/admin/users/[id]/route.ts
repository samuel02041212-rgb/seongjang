import { NextResponse } from "next/server";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function DELETE(
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
    if (!user?.registrationApproved) {
      if (user?.email === ADMIN_USER_EMAIL) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      const r = await prisma.user.deleteMany({
        where: { id, registrationApproved: false },
      });
      return NextResponse.json({ ok: r.count > 0 });
    }
    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (e) {
    console.error("[DELETE /api/admin/users/[id]]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
