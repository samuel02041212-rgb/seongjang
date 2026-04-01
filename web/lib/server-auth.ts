import { auth as nextAuth } from "@/auth";
import type { Session } from "next-auth";

import { prisma } from "@/lib/prisma";

/**
 * `.env`에 `AUTH_DEV_BYPASS=1`일 때만 시드 계정 `dev@seongjang.local`을 세션처럼 씁니다.
 * 기본값은 항상 비활성(실제 로그인 필요).
 */
function devBypassEnabled(): boolean {
  if (process.env.AUTH_DEV_BYPASS !== "1") return false;
  if (process.env.VERCEL === "1") return false;
  return true;
}

/** API·Server Components 용: NextAuth 또는 개발용 시드 계정 폴백 */
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
        "[auth] dev@seongjang.local 조회 실패 — DB 연결·migrate·seed 를 확인하세요.",
        e,
      );
    }
    return null;
  }
}
