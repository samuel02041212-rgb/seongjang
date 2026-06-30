import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { registrationAutoApprove } from "@/lib/registration-auto-approve";

const bodySchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(50),
  gender: z.enum(["M", "F"], { message: "성별을 선택해 주세요." }),
  birthDate: z
    .string()
    .min(1, "생년월일을 입력해 주세요.")
    .refine((s) => !Number.isNaN(Date.parse(s)), "올바른 날짜를 입력해 주세요."),
  church: z.string().trim().min(1, "출석 교회를 입력해 주세요.").max(200),
  signupSource: z.string().trim().max(500).optional().default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    const first =
      Object.values(msg).flat()[0] ?? "입력 값을 확인해 주세요.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { name, gender, birthDate, church, signupSource } = parsed.data;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return NextResponse.json(
      { error: "올바른 생년월일을 입력해 주세요." },
      { status: 400 },
    );
  }

  const kakaoAccount = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "kakao" },
    select: { id: true },
  });
  if (!kakaoAccount) {
    return NextResponse.json(
      { error: "카카오 로그인 후 가입할 수 있습니다." },
      { status: 403 },
    );
  }

  const autoApprove = registrationAutoApprove();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      gender,
      birthDate: birth,
      church,
      signupSource: signupSource || "kakao",
      registrationApproved: autoApprove,
    },
  });

  return NextResponse.json({
    ok: true,
    message: autoApprove
      ? "가입이 완료되었습니다."
      : "가입이 접수되었습니다. 관리자 승인 후 이용할 수 있습니다.",
  });
}
