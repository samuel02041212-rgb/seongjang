export function safeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/feed",
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
