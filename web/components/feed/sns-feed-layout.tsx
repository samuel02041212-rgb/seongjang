"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChatPanel } from "@/components/chat/chat-dock";
import { appHeaderRowClassName, appHeaderShellClass } from "@/components/shell/app-header-classes";
import { HeaderLogoGlyph } from "@/components/shell/header-logo-glyph";
import { useTheme } from "@/lib/theme";
import { meditationPageMaxWidthClass } from "@/lib/meditation-layout";
import { usePostViewMode } from "@/lib/view-mode";

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

const headerIcon = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const MoonIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SunIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <circle cx="12" cy="12" r="3.8" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2M20 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
  </svg>
);
const PopupViewIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M9 9h6M9 13h4" opacity="0.55" />
  </svg>
);
const SplitViewIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <rect x="4" y="5" width="7" height="14" rx="1.5" />
    <rect x="13" y="5" width="7" height="14" rx="1.5" />
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

  const { chatOpen, toggleChat, totalUnread, setChatOpen, splitDockTop, bringChatDockToFront } =
    useChatPanel();
  const [viewMode, setViewMode] = usePostViewMode();
  const pathname = usePathname();
  const mainMaxWidth =
    pathname === "/meditation" ? meditationPageMaxWidthClass : "max-w-6xl";
  const [theme, setTheme] = useTheme();

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
      <header
        className={`fixed inset-x-0 top-0 z-40 ${appHeaderShellClass}`}
      >
        <div className={appHeaderRowClassName}>
          <Link
            href="/feed"
            className="relative z-10 flex shrink-0 items-center gap-3"
            aria-label="성경나눔장소"
          >
            <HeaderLogoGlyph />
          </Link>
          <p
            lang="en"
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 text-center font-handwriting text-sm tracking-wide text-muted sm:text-base md:text-lg"
          >
            &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
          </p>
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-black transition-colors hover:text-accent dark:text-white dark:hover:text-accent"
              aria-label={theme === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "popup" ? "split" : "popup")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-black transition-colors hover:text-accent dark:text-white dark:hover:text-accent"
              aria-label={viewMode === "popup" ? "이분할로 보기" : "팝업으로 보기"}
            >
              {viewMode === "popup" ? <SplitViewIcon /> : <PopupViewIcon />}
            </button>
          </div>
        </div>
      </header>

      <aside className="group/nav fixed bottom-0 left-0 top-[var(--app-header-height)] z-50 hidden w-16 flex-col py-4 lg:flex">
        <div className="min-h-0 flex-1" />

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

        {isAuthenticated ? (
          <div className="flex justify-center pb-1">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                if (chatOpen && viewMode === "split" && splitDockTop !== "chat") {
                  bringChatDockToFront();
                  return;
                }
                toggleChat();
              }}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-accent-soft hover:text-accent-foreground focus:outline-none"
              aria-label={chatOpen ? "채팅 닫기" : "채팅 열기"}
              aria-expanded={chatOpen}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              {!chatOpen && totalUnread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#e0245e] px-1 text-[10px] font-bold leading-none text-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              ) : null}
            </button>
          </div>
        ) : null}

        <div
          className="relative flex justify-center pb-2"
          ref={profileRef}
        >
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setChatOpen(false);
            }}
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

      <main
        className={`mx-auto w-full px-3 pt-[40px] sm:px-4 lg:pl-20 ${mainMaxWidth}`}
      >
        {children}
      </main>
    </div>
  );
}
