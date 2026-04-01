import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSkippablePath(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.warn("[middleware] AUTH_SECRET 없음 — 로그인 보호 생략");
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret });
  if (token) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
