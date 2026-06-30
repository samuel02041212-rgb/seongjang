import { prisma } from "@/lib/prisma";

type KakaoAccount = {
  profile?: { nickname?: string | null; profile_image_url?: string | null };
  gender?: string | null;
  birthday?: string | null;
  birthyear?: string | null;
  email?: string | null;
};

export type KakaoOAuthProfile = {
  id: number;
  kakao_account?: KakaoAccount;
};

export function parseKakaoGender(raw?: string | null): "M" | "F" | null {
  if (raw === "male") return "M";
  if (raw === "female") return "F";
  return null;
}

export function parseKakaoBirthDate(acc?: KakaoAccount): Date | null {
  const y = acc?.birthyear?.trim();
  const bd = acc?.birthday?.trim();
  if (!y || !bd || bd.length < 4) return null;
  const m = bd.slice(0, 2);
  const d = bd.slice(2, 4);
  const dt = new Date(`${y}-${m}-${d}T12:00:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function kakaoProfileEmail(profile: KakaoOAuthProfile): string {
  const email = profile.kakao_account?.email?.trim().toLowerCase();
  if (email) return email;
  return `kakao_${profile.id}@kakao.local`;
}

export function kakaoProfileFields(profile: KakaoOAuthProfile) {
  const acc = profile.kakao_account;
  return {
    name: acc?.profile?.nickname?.trim() || "회원",
    image: acc?.profile?.profile_image_url ?? null,
    email: kakaoProfileEmail(profile),
    gender: parseKakaoGender(acc?.gender),
    birthDate: parseKakaoBirthDate(acc),
  };
}

export async function syncKakaoUserProfile(
  userId: string,
  profile: unknown,
) {
  const fields = kakaoProfileFields(profile as KakaoOAuthProfile);
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: fields.name,
      image: fields.image,
      ...(fields.gender ? { gender: fields.gender } : {}),
      ...(fields.birthDate ? { birthDate: fields.birthDate } : {}),
    },
  });
}

export function formatBirthDateLabel(birthDate: Date | null): string | null {
  if (!birthDate) return null;
  const y = birthDate.getFullYear();
  const m = birthDate.getMonth() + 1;
  const d = birthDate.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

export function formatGenderLabel(gender: string | null): string | null {
  if (gender === "M") return "남";
  if (gender === "F") return "여";
  return null;
}
