import { prisma } from "@/lib/prisma";
import type { GroupJson } from "@/lib/group-types";

export type { GroupJson } from "@/lib/group-types";

export function serializeGroup(
  g: {
    id: string;
    name: string;
    image: string | null;
    statusMessage: string;
    description: string;
    adminId: string;
  },
  viewerId: string,
  opts?: { isMember?: boolean; joinStatus?: GroupJson["joinStatus"] },
): GroupJson {
  const isMember = opts?.isMember ?? false;
  return {
    id: g.id,
    name: g.name,
    image: g.image,
    statusMessage: g.statusMessage,
    description: g.description,
    adminId: g.adminId,
    isAdmin: g.adminId === viewerId,
    isMember,
    joinStatus: opts?.joinStatus ?? (isMember ? "member" : "none"),
  };
}

export async function isGroupAdmin(userId: string, groupId: string) {
  const g = await prisma.smallGroup.findFirst({
    where: { id: groupId, adminId: userId },
    select: { id: true },
  });
  return !!g;
}

export async function userManagesAnyGroup(userId: string) {
  try {
    const n = await prisma.smallGroup.count({ where: { adminId: userId } });
    return n > 0;
  } catch {
    return false;
  }
}
