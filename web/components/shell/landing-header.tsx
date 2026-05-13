import Link from "next/link";

import { appHeaderRowClassName, appHeaderShellClass } from "@/components/shell/app-header-classes";
import { HeaderLogoGlyph } from "@/components/shell/header-logo-glyph";

type LandingHeaderProps = {
  loggedIn: boolean;
};

export function LandingHeader({ loggedIn }: LandingHeaderProps) {
  return (
    <header className={`sticky top-0 z-40 ${appHeaderShellClass}`}>
      <div className={appHeaderRowClassName}>
        <Link
          href={loggedIn ? "/feed" : "/"}
          className="flex min-w-0 flex-1 items-center gap-3 pr-2"
          aria-label="성경나눔장소"
        >
          <HeaderLogoGlyph />
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
