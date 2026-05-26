import { feedDateRangeUtc, feedTodayIso } from "@/lib/feed-date";
import { postDisplayTitle } from "@/lib/group-post-msg";
import type { GroupChatMsgJson, GroupMemberRow } from "@/lib/group-types";
import { formatMemberName } from "@/lib/group-types";
import { prisma } from "@/lib/prisma";

export async function assertGroupMember(userId: string, groupId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return !!member;
}

export async function loadGroupRoom(groupId: string, viewerId: string) {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: viewerId, groupId } },
  });
  if (!member) return null;

  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      image: true,
      statusMessage: true,
    },
  });
  if (!group) return null;

  const memberships = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const memberIds = memberships.map((m) => m.userId);
  const range = feedDateRangeUtc(feedTodayIso());
  const posts = await prisma.post.findMany({
    where: {
      authorId: { in: memberIds },
      createdAt: { gte: range.gte, lt: range.lt },
    },
    orderBy: { createdAt: "desc" },
    select: {
      authorId: true,
      title: true,
      bibleRef: true,
      content: true,
    },
  });

  const postByAuthor = new Map<string, (typeof posts)[0]>();
  for (const p of posts) {
    if (!postByAuthor.has(p.authorId)) postByAuthor.set(p.authorId, p);
  }

  const members: GroupMemberRow[] = memberships.map((m) => {
    const post = postByAuthor.get(m.userId);
    return {
      userId: m.userId,
      name: formatMemberName(m.user.name, m.user.email),
      image: m.user.image,
      todayPostTitle: post ? postDisplayTitle(post) : null,
      hasPostedToday: !!post,
    };
  });

  return { group, members };
}

export function serializeGroupMessage(
  m: {
    id: string;
    senderId: string;
    kind: string;
    content: string;
    createdAt: Date;
    sender: { name: string | null; email: string };
  },
  viewerId: string,
): GroupChatMsgJson {
  return {
    id: m.id,
    mine: m.senderId === viewerId,
    kind: m.kind,
    content: m.content,
    senderName: formatMemberName(m.sender.name, m.sender.email),
    time: m.createdAt.toISOString(),
  };
}
