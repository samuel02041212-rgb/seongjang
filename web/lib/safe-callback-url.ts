/** 오픈 리디렉션 방지: 동일 출처 상대 경로만 허용 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/feed",
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
