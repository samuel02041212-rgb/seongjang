"use client";

import Link from "next/link";
import { useState } from "react";

type LandingHeaderProps = {
  loggedIn: boolean;
};

export function LandingHeader({ loggedIn }: LandingHeaderProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="flex h-[var(--app-header-height)] w-full items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href={loggedIn ? "/feed" : "/"}
          className="flex min-w-0 flex-1 items-center gap-3 pr-2"
          aria-label="성경나눔장소"
        >
          {logoFailed ? (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground shadow-sm"
              aria-hidden
            >
              성
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-xl object-contain shadow-sm ring-1 ring-black/5"
              onError={() => setLogoFailed(true)}
            />
          )}
          <span className="truncate text-xl font-semibold tracking-tight text-ink">
            성경나눔장소
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 text-base font-medium">
          {loggedIn ? (
            <Link
              href="/feed"
              className="rounded-full bg-accent px-5 py-2.5 text-accent-foreground shadow-sm transition hover:bg-accent/90"
            >
              피드로
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-full px-4 py-2 text-muted transition hover:bg-accent-soft hover:text-accent-foreground"
              >
                회원가입
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-accent px-5 py-2.5 text-accent-foreground shadow-sm transition hover:bg-accent/90"
              >
                로그인
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
