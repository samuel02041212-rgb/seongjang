import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      registrationApproved: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name?.trim() || u.email || "사용자",
      image: u.image,
    })),
  );
}
