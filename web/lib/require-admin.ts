import { auth } from "@/lib/server-auth";

/** 관리자 세션만 반환. 없으면 `null`. */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) return null;
  return session;
}
