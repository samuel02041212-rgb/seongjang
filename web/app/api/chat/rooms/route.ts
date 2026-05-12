import { NextResponse } from "next/server";
import { z } from "zod";

import { chatRoomPair } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const rooms = await prisma.chatRoom.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      userA: { select: { id: true, name: true, email: true, image: true } },
      userB: { select: { id: true, name: true, email: true, image: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderId: true },
      },
    },
  });

  const result = await Promise.all(
    rooms.map(async (r) => {
      const other = r.userAId === me ? r.userB : r.userA;
      const lastReadAt = r.userAId === me ? r.lastReadAtA : r.lastReadAtB;
      const unreadCount = await prisma.chatMessage.count({
        where: {
          roomId: r.id,
          senderId: { not: me },
          createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
        },
      });
      const lastMsg = r.messages[0];
      return {
        roomId: r.id,
        otherId: other.id,
        otherName: other.name?.trim() || other.email || "사용자",
        otherImage: other.image,
        preview: lastMsg?.content ?? "",
        lastMessageAt: r.lastMessageAt?.toISOString() ?? null,
        unreadCount,
      };
    }),
  );

  return NextResponse.json(result);
}

const createBody = z.object({
  otherUserId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const parsed = createBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const otherId = parsed.data.otherUserId;
  if (otherId === me) {
    return NextResponse.json({ error: "self" }, { status: 400 });
  }
  const other = await prisma.user.findUnique({
    where: { id: otherId },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!other) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const pair = chatRoomPair(me, otherId);
  const room = await prisma.chatRoom.upsert({
    where: { userAId_userBId: pair },
    create: pair,
    update: {},
  });
  return NextResponse.json({
    roomId: room.id,
    otherId: other.id,
    otherName: other.name?.trim() || other.email || "사용자",
    otherImage: other.image,
  });
}
