import { redirect } from "next/navigation";

import { auth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export default async function GroupManagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=%2Fgroup%2Fmanage");
  }

  const group = await prisma.smallGroup.findFirst({
    where: { adminId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (group) {
    redirect(`/group/${group.id}/manage`);
  }
  redirect("/group/mygroups");
}
