import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/server-auth";

async function getRoomForUser(roomId: string, userId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!room) return null;
  if (room.userAId !== userId && room.userBId !== userId) return null;
  return room;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;
  const { id } = await params;
  const room = await getRoomForUser(id, me);
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await prisma.chatMessage.findMany({
    where: { roomId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
    },
  });

  const now = new Date();
  await prisma.chatRoom.update({
    where: { id },
    data:
      room.userAId === me
        ? { lastReadAtA: now }
        : { lastReadAtB: now },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      mine: m.senderId === me,
      text: m.content,
      time: m.createdAt.toISOString(),
    })),
  );
}

const postBody = z.object({
  content: z.string().trim().min(1).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;
  const { id } = await params;
  const room = await getRoomForUser(id, me);
  if (!room) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const parsed = postBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const now = new Date();
  const msg = await prisma.chatMessage.create({
    data: {
      roomId: id,
      senderId: me,
      content: parsed.data.content,
    },
    select: { id: true, content: true, createdAt: true },
  });
  await prisma.chatRoom.update({
    where: { id },
    data:
      room.userAId === me
        ? { lastMessageAt: now, lastReadAtA: now }
        : { lastMessageAt: now, lastReadAtB: now },
  });

  return NextResponse.json({
    id: msg.id,
    mine: true,
    text: msg.content,
    time: msg.createdAt.toISOString(),
  });
}
