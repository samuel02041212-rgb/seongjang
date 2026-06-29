import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 });
  }

  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      church: true,
      statusMessage: true,
      registrationApproved: true,
    },
  });

  if (!user?.registrationApproved) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    church: user.church ?? "",
    statusMessage: user.statusMessage ?? "",
    image: user.image,
  });
}
