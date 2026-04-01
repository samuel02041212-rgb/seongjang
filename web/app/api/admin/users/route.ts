import { NextResponse } from "next/server";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

function mapUser(u: {
  id: string;
  name: string | null;
  email: string;
  registrationApproved: boolean;
  createdAt: Date;
  church: string;
  gender: string | null;
  birthDate: Date | null;
  signupSource: string;
}) {
  const isAdminUser = u.email === ADMIN_USER_EMAIL;
  return {
    _id: u.id,
    username: u.name ?? "",
    email: u.email,
    role: isAdminUser ? "admin" : undefined,
    isApproved: u.registrationApproved,
    createdAt: u.createdAt.toISOString(),
    church: u.church || null,
    gender: u.gender,
    birthDate: u.birthDate?.toISOString() ?? null,
    signupSource: u.signupSource || null,
  };
}

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        registrationApproved: true,
        createdAt: true,
        church: true,
        gender: true,
        birthDate: true,
        signupSource: true,
      },
    });
    return NextResponse.json(users.map(mapUser));
  } catch (e) {
    console.error("[GET /api/admin/users]", e);
    return NextResponse.json([], { status: 500 });
  }
}
