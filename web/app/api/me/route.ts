import { NextResponse } from "next/server";

import { ADMIN_USER_EMAIL } from "@/lib/auth-constants";
import { auth } from "@/lib/server-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(null, { status: 401 });
  }
  const email = session.user.email ?? "";
  return NextResponse.json({
    id: session.user.id,
    name: session.user.name,
    email,
    role: email === ADMIN_USER_EMAIL || session.user.isAdmin ? "admin" : "user",
  });
}
