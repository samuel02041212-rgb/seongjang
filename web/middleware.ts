import NextAuth from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

function isPublicPath(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return true;
  }
  return false;
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

  if (isSkippablePath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth as { user?: { id?: string } } | null;
  if (!session?.user?.id) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
