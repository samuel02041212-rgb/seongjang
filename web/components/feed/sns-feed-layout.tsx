"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type JoinedGroup = {
  id: string;
  name: string;
  href?: string;
};

type SnsFeedLayoutProps = {
  children: React.ReactNode;
  joinedGroups: JoinedGroup[];
  userName?: string | null;
  userImage?: string | null;
  isAuthenticated?: boolean;
  isAdmin?: boolean;
};

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    function handle(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, [ref, onOutside, active]);
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const FeedIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);
const BookHeartIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" />
    <path d="M9.5 9.2a1.7 1.7 0 0 1 2.4 0l.1.1.1-.1a1.7 1.7 0 1 1 2.4 2.4L12 14l-2.5-2.4a1.7 1.7 0 0 1 0-2.4z" />
  </svg>
);
const BookIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" />
    <path d="M8 9h7M8 13h7" />
  </svg>
);
const UsersIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="9" cy="9" r="3.2" />
    <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
    <circle cx="17" cy="8" r="2.6" />
    <path d="M15 14.5c.6-.3 1.3-.5 2-.5 2.2 0 4 1.6 4 4" />
  </svg>
);
const UserIcon = () => (
  <svg {...iconProps} aria-hidden>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4 20c0-3.6 3.6-6.4 8-6.4s8 2.8 8 6.4" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M12 3l8 3v6c0 4.6-3.4 8.4-8 9-4.6-.6-8-4.4-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export function SnsFeedLayout({
  children,
  joinedGroups: _joinedGroups,
  userName: _userName,
  userImage: _userImage,
  isAuthenticated = false,
  isAdmin = false,
}: SnsFeedLayoutProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  useClickOutside(profileRef, closeProfile, profileOpen);

  void _joinedGroups;
  void _userName;
  void _userImage;

  const navItems = useMemo(() => {
    const items: { label: string; href: string; icon: React.ReactNode }[] = [
      { label: "게시글", href: "/feed", icon: <FeedIcon /> },
      { label: "말씀묵상", href: "/meditation", icon: <BookHeartIcon /> },
      { label: "말씀연구", href: "/study", icon: <BookIcon /> },
      { label: "소그룹", href: "/group/mygroups", icon: <UsersIcon /> },
      { label: "마이페이지", href: "/me", icon: <UserIcon /> },
    ];
    if (isAdmin) {
      items.push({ label: "관리자", href: "/admin", icon: <ShieldIcon /> });
    }
    return items;
  }, [isAdmin]);

  return (
    <div className="relative min-h-screen bg-bg pb-24 pt-[var(--app-header-height)]">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/80 bg-surface/95 backdrop-blur-md">
        <div className="h-[var(--app-header-height)] w-full" />
      </header>

      <aside className="group/nav fixed left-0 top-0 z-50 hidden h-screen w-16 flex-col py-4 lg:flex">
        <div className="flex-1" />

        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-accent-soft hover:text-accent-foreground"
              aria-label={item.label}
            >
              {item.icon}
              <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-1 text-sm font-medium text-ink opacity-0 shadow-md transition-opacity duration-150 group-hover/nav:opacity-100">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div
          className="relative flex justify-center pb-2"
          ref={profileRef}
        >
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-accent-soft hover:text-accent-foreground focus:outline-none"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="프로필 메뉴"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {profileOpen ? (
            <div
              className="absolute bottom-[calc(100%+8px)] left-2 z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-lg"
              role="menu"
            >
              {isAuthenticated ? (
                <>
                  <Link
                    href="/settings"
                    className="block px-4 py-3 text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    설정
                  </Link>
                  <Link
                    href="/"
                    className="block px-4 py-3 text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    성장 소개
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-4 py-3 text-left text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={() => {
                      closeProfile();
                      void signOut({ callbackUrl: "/" });
                    }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    회원가입
                  </Link>
                  <Link
                    href="/"
                    className="block px-4 py-3 text-base font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    성장 소개
                  </Link>
                </>
              )}
            </div>
          ) : null}
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-4 lg:pl-20">
        {children}
      </main>
    </div>
  );
}
