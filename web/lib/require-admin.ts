import { auth } from "@/lib/server-auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) return null;
  return session;
}
