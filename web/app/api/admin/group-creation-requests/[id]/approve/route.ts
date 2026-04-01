import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/require-admin";

export async function POST() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return NextResponse.json(
    {
      ok: false,
      message: "소그룹 개설 승인은 아직 이 버전에서 구현되지 않았습니다.",
    },
    { status: 501 },
  );
}
