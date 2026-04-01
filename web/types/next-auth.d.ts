import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin?: boolean;
  }
  interface Session {
    user: {
      id: string;
      /** `admin@seongjang.local` (로그인 a/a) */
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
    /** `next dev` 서버 기동 시점 — 재시작 시 변경되어 세션 무효화 */
    devEpoch?: string;
  }
}
