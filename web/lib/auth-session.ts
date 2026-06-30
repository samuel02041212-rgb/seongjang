export const AUTH_REMEMBER_COOKIE = "auth-remember";

export const SESSION_MAX_AGE_REMEMBER = 30 * 24 * 60 * 60;
export const SESSION_MAX_AGE_SHORT = 12 * 60 * 60;

export function sessionExpirySec(
  remember: boolean,
  nowSec = Math.floor(Date.now() / 1000),
): number {
  return nowSec + (remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_SHORT);
}

export function readRememberFromCookie(
  value: string | undefined,
): boolean {
  if (value === undefined) return true;
  return value === "1";
}
