import type { NextConfig } from "next";

/**
 * `next dev` 프로세스가 새로 뜰 때마다 바뀜 → JWT에 묶어 두고,
 * 구세대 쿠키는 무효화(로컬에서 서버 재시작 시 로그아웃처럼 동작).
 * `next build` / 프로덕션에는 주입하지 않음.
 */
const authDevSessionEpoch =
  process.env.NODE_ENV === "production"
    ? undefined
    : String(Date.now());

const nextConfig: NextConfig = {
  ...(authDevSessionEpoch
    ? { env: { AUTH_DEV_SESSION_EPOCH: authDevSessionEpoch } }
    : {}),
};

export default nextConfig;
