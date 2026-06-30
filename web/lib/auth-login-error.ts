const MESSAGES: Record<string, string> = {
  Configuration:
    "로그인 설정 오류입니다. AUTH_SECRET, DATABASE_URL, 카카오 키를 확인해 주세요.",
  AccessDenied: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  OAuthAccountNotLinked:
    "이미 다른 방식으로 가입된 이메일입니다. 관리자에게 문의해 주세요.",
  OAuthCallback:
    "카카오 로그인 응답 처리에 실패했습니다. 카카오 앱 키·Redirect URI를 확인해 주세요.",
  OAuthSignin: "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  Callback: "로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  Default: "로그인에 실패했습니다. 다시 시도해 주세요.",
};

export function loginAuthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? MESSAGES.Default;
}
