"use client";

import { useState } from "react";

export function HeaderLogoGlyph() {
  const [logoFailed, setLogoFailed] = useState(false);

  return logoFailed ? (
    <span
      className="flex h-[calc(3rem*0.8)] w-[calc(3rem*0.8)] shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground"
      aria-hidden
    >
      성
    </span>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      width={38}
      height={38}
      className="block h-[calc(3rem*0.8)] w-[calc(3rem*0.8)] shrink-0 rounded-xl object-contain"
      onError={() => setLogoFailed(true)}
    />
  );
}
