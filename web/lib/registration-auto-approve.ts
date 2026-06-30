export function registrationAutoApprove(): boolean {
  return (
    process.env.REGISTRATION_AUTO_APPROVE === "1" ||
    process.env.NODE_ENV === "development"
  );
}

/** Kakao 가입은 prod에서 관리자 승인 필수. Vercel prod에 REGISTRATION_AUTO_APPROVE=1 일 때만 자동 승인. */
export function kakaoRegistrationAutoApprove(): boolean {
  return process.env.REGISTRATION_AUTO_APPROVE === "1";
}
