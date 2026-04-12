import { auth as nextAuth } from "@/auth";
import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

function devBypassEnabled(): boolean {
  if (process.env.AUTH_DEV_BYPASS !== "1") return false;
  if (process.env.VERCEL === "1") return false;
  return true;
}

export async function auth(): Promise<Session | null> {
  const session = await nextAuth();
  if (session?.user?.id) return session;

  if (!devBypassEnabled()) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email: "dev@seongjang.local" },
    });
    if (!user?.registrationApproved) return null;

    return {
      user: {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        image: user.image ?? undefined,
      },
      expires: new Date(Date.now() + 86400000 * 365).toISOString(),
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[auth] dev@seongjang.local lookup failed",
        e,
      );
    }
    return null;
  }
}
