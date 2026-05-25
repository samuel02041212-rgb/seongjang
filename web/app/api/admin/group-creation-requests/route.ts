import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await prisma.groupCreationRequest.findMany({
      where: { status: "pending" },
      include: {
        requester: { select: { id: true, name: true, email: true, church: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        image: r.image,
        createdAt: r.createdAt.toISOString(),
        requester: {
          id: r.requester.id,
          name:
            r.requester.name?.trim() ||
            r.requester.email.split("@")[0] ||
            "회원",
          church: r.requester.church,
        },
      })),
    );
  } catch (e) {
    console.error("[GET /api/admin/group-creation-requests]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
