"use client";

import { useState } from "react";

export function LandingHeaderLogo() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <span className="relative block h-10 w-10 shrink-0 sm:h-11 sm:w-11">
      <span
        className="absolute inset-0 rounded-2xl bg-accent shadow-md transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0"
        aria-hidden
      />
      {logoFailed ? (
        <span
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-surface text-base font-bold text-accent-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        >
          성
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          className="absolute inset-0 h-full w-full rounded-2xl object-contain opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          onError={() => setLogoFailed(true)}
        />
      )}
    </span>
  );
}
