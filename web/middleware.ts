import NextAuth from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

type SessionUser = {
  id?: string;
  registrationApproved?: boolean;
  profileComplete?: boolean;
};

function isPublicPath(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/login")) {
    return true;
  }
  return false;
}

function isSignupPath(pathname: string) {
  return (
    pathname.startsWith("/register/kakao") ||
    pathname.startsWith("/register/pending")
  );
}

function isSkippablePath(pathname: string) {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(?:css|js|map|json|png|jpg|jpeg|gif|webp|svg|ico|txt|woff2?)$/i.test(pathname)) {
    return true;
  }
  return false;
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  if (isSkippablePath(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth as { user?: SessionUser } | null;
  const user = session?.user;

  if (pathname.startsWith("/register") && !isSignupPath(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!user?.id) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (!user.profileComplete) {
    if (!pathname.startsWith("/register/kakao")) {
      return NextResponse.redirect(new URL("/register/kakao", req.url));
    }
    return NextResponse.next();
  }

  if (!user.registrationApproved) {
    if (!pathname.startsWith("/register/pending")) {
      return NextResponse.redirect(new URL("/register/pending", req.url));
    }
    return NextResponse.next();
  }

  if (isSignupPath(pathname)) {
    return NextResponse.redirect(new URL("/feed", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
