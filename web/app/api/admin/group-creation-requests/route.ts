import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json([]);
}
