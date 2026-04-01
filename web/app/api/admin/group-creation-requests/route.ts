import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";

/** 레거시 소그룹 개설 요청 목록 — Postgres 재구축 단계에서는 스키마 미도입으로 빈 배열 */
export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json([]);
}
