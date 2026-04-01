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
  /** 실제 NextAuth 세션(또는 서버에서 판별한 로그인 여부) */
  isAuthenticated?: boolean;
  /** DB `User.isAdmin` 등 — FAB에 관리자 링크 */
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

export function SnsFeedLayout({
  children,
  joinedGroups,
  userName,
  userImage,
  isAuthenticated = false,
  isAdmin = false,
}: SnsFeedLayoutProps) {
  const [fabOpen, setFabOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  /** `/logo.png`(public) 로드 실패 시 이전 글자 마크 표시 */
  const [logoFailed, setLogoFailed] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const closeFab = useCallback(() => setFabOpen(false), []);
  const closeProfile = useCallback(() => setProfileOpen(false), []);

  useClickOutside(fabRef, closeFab, fabOpen);
  useClickOutside(profileRef, closeProfile, profileOpen);

  const initial = (userName?.trim() || "?").slice(0, 1);

  const fabCoreNav = useMemo(() => {
    const items: { label: string; href: string }[] = [
      { label: "마이페이지", href: "/me" },
    ];
    if (isAdmin) {
      items.push({ label: "관리자", href: "/admin" });
    }
    items.push(
      { label: "말씀묵상", href: "/meditation" },
      { label: "말씀연구", href: "/study" },
      { label: "소그룹", href: "/group/mygroups" },
    );
    return items;
  }, [isAdmin]);

  return (
    <div
      className="relative min-h-screen bg-bg pb-24 pt-[var(--app-header-height)]"
    >
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line/80 bg-surface/95 backdrop-blur-md">
        <div className="flex h-[var(--app-header-height)] w-full items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/feed"
            className="flex min-w-0 flex-1 items-center gap-3 pr-2"
            aria-label="성경나눔장소 피드"
          >
            {logoFailed ? (
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground shadow-sm"
                aria-hidden
              >
                성
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- public 자산, 로드 실패 시 위 폴백
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

          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setFabOpen(false);
              }}
              className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-accent/40 bg-accent-soft shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="프로필 메뉴"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-accent-foreground">
                  {initial}
                </span>
              )}
            </button>

            {profileOpen ? (
              <div
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-lg"
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-4">
        {children}
      </main>

      {/* FAB: 왼쪽 아래, 클릭 시 위로 네비 */}
      <div
        className="fixed bottom-6 left-4 z-50 flex flex-col items-start gap-2"
        ref={fabRef}
      >
        <div
          className={`flex flex-col-reverse gap-2 transition-all duration-200 ease-out ${
            fabOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
          aria-hidden={!fabOpen}
        >
          {/* column-reverse: DOM 순서 = FAB에 가까운 것부터 → 위로 갈수록 소그룹 */}
          {fabCoreNav.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="flex max-w-[min(280px,calc(100vw-5rem))] items-center rounded-full border border-line bg-surface px-5 py-3 text-base font-medium text-ink shadow-md transition hover:border-accent/50 hover:bg-accent-soft"
              onClick={closeFab}
            >
              {item.label}
            </Link>
          ))}
          {joinedGroups.length > 0 ? (
            <div className="my-1 h-px w-full max-w-[200px] bg-line" aria-hidden />
          ) : null}
          {joinedGroups.map((g) => (
            <Link
              key={g.id}
              href={g.href ?? `/group/${g.id}`}
              className="flex max-w-[min(280px,calc(100vw-5rem))] items-center rounded-full border border-line bg-surface px-5 py-3 text-base font-medium text-ink shadow-md transition hover:border-accent/50 hover:bg-accent-soft"
              onClick={closeFab}
            >
              <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
              <span className="truncate">{g.name}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setFabOpen((v) => !v);
            setProfileOpen(false);
          }}
          className={`flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-bg transition hover:bg-accent/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
            fabOpen ? "rotate-45" : ""
          }`}
          aria-expanded={fabOpen}
          aria-label={fabOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform duration-200"
            aria-hidden
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
