import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await prisma.smallGroup.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true, church: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      rows.map((g) => ({
        id: g.id,
        name: g.name,
        statusMessage: g.statusMessage,
        description: g.description,
        image: g.image,
        createdAt: g.createdAt.toISOString(),
        memberCount: g._count.members,
        admin: {
          id: g.admin.id,
          name:
            g.admin.name?.trim() ||
            g.admin.email.split("@")[0] ||
            "회원",
          church: g.admin.church,
        },
      })),
    );
  } catch (e) {
    console.error("[GET /api/admin/groups]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
