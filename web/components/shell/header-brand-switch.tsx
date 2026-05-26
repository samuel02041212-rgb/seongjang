"use client";

import { GroupAvatar } from "@/components/group/group-avatar";
import { HeaderLogoGlyph } from "@/components/shell/header-logo-glyph";

const switchOverlayClass =
  "pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-ink/50 text-white opacity-0 transition-opacity group-hover/switch:opacity-100";

function SwitchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 16l7-7" />
    </svg>
  );
}

export function LogoPickerButton({
  onClick,
  expanded,
}: {
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/switch relative z-10 shrink-0 rounded-xl transition hover:opacity-90"
      aria-label="소그룹 선택"
      aria-expanded={expanded}
    >
      <HeaderLogoGlyph />
      <span className={switchOverlayClass}>
        <SwitchIcon />
      </span>
    </button>
  );
}

export function GroupPickerButton({
  name,
  image,
  onClick,
  expanded,
}: {
  name: string;
  image: string | null;
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/switch relative z-10 flex min-w-0 max-w-[min(100%,10rem)] items-center gap-2.5 rounded-xl transition hover:opacity-90 sm:max-w-xs"
      aria-label="소그룹 선택"
      aria-expanded={expanded}
    >
      <span className="relative shrink-0">
        <GroupAvatar
          image={image}
          rounded="xl"
          className="h-[calc(3rem*0.8)] w-[calc(3rem*0.8)] border-0"
        />
        <span className={switchOverlayClass}>
          <SwitchIcon />
        </span>
      </span>
      <span className="truncate text-sm font-medium text-ink sm:text-base">
        {name}
      </span>
    </button>
  );
}
