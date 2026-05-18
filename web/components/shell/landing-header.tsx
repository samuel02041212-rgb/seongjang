import Link from "next/link";

import { LandingHeaderLogo } from "@/components/shell/landing-header-logo";

const landingHeaderRowClassName =
  "relative flex w-full items-start justify-end gap-3 px-4 pt-0 sm:px-6";

type LandingHeaderProps = {
  loggedIn: boolean;
};

export function LandingHeader({ loggedIn }: LandingHeaderProps) {
  const logoHref = loggedIn ? "/feed" : "/login";
  const logoLabel = loggedIn ? "피드로" : "로그인";

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 bg-transparent">
      <div className={`${landingHeaderRowClassName} pointer-events-auto`}>
        <Link
          href={logoHref}
          className="group mt-4 shrink-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:mt-5 md:mt-6"
          aria-label={logoLabel}
        >
          <LandingHeaderLogo />
        </Link>
      </div>
    </header>
  );
}
