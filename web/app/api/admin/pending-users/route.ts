import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      where: { registrationApproved: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        church: true,
        gender: true,
        birthDate: true,
        signupSource: true,
      },
    });
    return NextResponse.json(
      users.map((u) => ({
        _id: u.id,
        username: u.name ?? "",
        email: u.email,
        createdAt: u.createdAt.toISOString(),
        church: u.church || null,
        gender: u.gender,
        birthDate: u.birthDate?.toISOString() ?? null,
        signupSource: u.signupSource || null,
      })),
    );
  } catch (e) {
    console.error("[GET /api/admin/pending-users]", e);
    return NextResponse.json([], { status: 500 });
  }
}
