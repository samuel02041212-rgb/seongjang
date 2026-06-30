export function kakaoClientId(): string {
  return process.env.AUTH_KAKAO_ID?.trim() ?? "";
}

export function kakaoClientSecret(): string {
  return process.env.AUTH_KAKAO_SECRET?.trim() ?? "";
}

export function isKakaoAuthConfigured(): boolean {
  return Boolean(kakaoClientId() && kakaoClientSecret());
}
