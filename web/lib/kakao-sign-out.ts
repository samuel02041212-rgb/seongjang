"use client";

import { signOut } from "next-auth/react";

export async function kakaoSignOut() {
  await signOut({ redirect: false });
  const clientId = process.env.NEXT_PUBLIC_AUTH_KAKAO_ID?.trim();
  const loginUrl = `${window.location.origin}/login`;
  if (!clientId) {
    window.location.assign(loginUrl);
    return;
  }
  try {
    const url = new URL("https://kauth.kakao.com/oauth/logout");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("logout_redirect_uri", loginUrl);
    window.location.assign(url.toString());
  } catch {
    window.location.assign(loginUrl);
  }
}
