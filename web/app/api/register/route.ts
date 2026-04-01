import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(50),
  gender: z.enum(["M", "F"], { message: "성별을 선택해 주세요." }),
  birthDate: z
    .string()
    .min(1, "생년월일을 입력해 주세요.")
    .refine((s) => !Number.isNaN(Date.parse(s)), "올바른 날짜를 입력해 주세요."),
  church: z.string().trim().min(1, "출석 교회를 입력해 주세요.").max(200),
  email: z.string().email("올바른 이메일을 입력해 주세요."),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(128),
  signupSource: z.string().trim().max(500).optional().default(""),
});

export async function POST(req: Request) {
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

  const { name, gender, birthDate, church, email, password, signupSource } =
    parsed.data;
  const normalizedEmail = email.toLowerCase();
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return NextResponse.json(
      { error: "올바른 생년월일을 입력해 주세요." },
      { status: 400 },
    );
  }
  const autoApprove =
    process.env.REGISTRATION_AUTO_APPROVE === "1" ||
    process.env.NODE_ENV === "development";

  try {
    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (exists) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name,
        gender,
        birthDate: birth,
        church,
        signupSource: signupSource ?? "",
        email: normalizedEmail,
        password: passwordHash,
        registrationApproved: autoApprove,
      },
    });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json(
      {
        error:
          "데이터베이스에 연결할 수 없습니다. DATABASE_URL 과 Neon 상태를 확인해 주세요.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: autoApprove
      ? "가입이 완료되었습니다. 로그인해 주세요."
      : "가입이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.",
  });
}
