import { NextResponse } from "next/server";

import { loadGroupRoom } from "@/lib/group-room";
import { auth } from "@/lib/server-auth";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const room = await loadGroupRoom(id, session.user.id);
    if (!room) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(room);
  } catch (e) {
    console.error("[GET /api/groups/[id]/room]", e);
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
