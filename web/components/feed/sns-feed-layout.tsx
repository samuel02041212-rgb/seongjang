"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChatPanel } from "@/components/chat/chat-dock";
import { GroupNavActions } from "@/components/group/group-nav-actions";
import { useGroupPanel } from "@/components/group/group-panel";
import {
  PinnedAnnouncementProvider,
  PinnedNoticeHeaderTitle,
  PinnedNoticeNavButton,
} from "@/components/announcement/pinned-announcement-context";
import { HeaderLogoGlyph } from "@/components/shell/header-logo-glyph";
import { AppHeaderCenter } from "@/components/shell/app-header-center";
import {
  GroupPickerButton,
  LogoPickerButton,
} from "@/components/shell/header-brand-switch";
import { FeedBrowseProvider } from "@/components/shell/feed-browse-context";
import { appHeaderRowClassName, appHeaderShellClass } from "@/components/shell/app-header-classes";
import {
  SiteTourProvider,
  groupNavTourId,
  mainNavTourId,
  useSiteTour,
} from "@/components/shell/site-tour";
import { useTheme } from "@/lib/theme";
import { useFeedLayoutMode } from "@/lib/feed-layout-mode";
import { meditationPageMaxWidthClass } from "@/lib/meditation-layout";
import { groupPath, parseGroupRoute } from "@/lib/group-route";
import { usePostViewMode } from "@/lib/view-mode";

type SnsFeedLayoutProps = {
  children: React.ReactNode;
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
const RecordIcon = () => (
  <svg {...iconProps} aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h8" />
  </svg>
);
const ResourcesIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M4 4h6l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
    <path d="M8 12h8M8 16h5" />
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
const ChatIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
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
const ResearchModeIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3V4z" />
    <path d="M8 8h6M8 12h6M8 16h4" />
  </svg>
);
const FeedDailyIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const FeedTimelineIcon = () => (
  <svg {...headerIcon} aria-hidden>
    <path d="M4 6h16M4 12h10M4 18h14" />
  </svg>
);

export function SnsFeedLayout({
  children,
  isAuthenticated = false,
  isAdmin = false,
}: SnsFeedLayoutProps) {
  return (
    <SiteTourProvider isAdmin={isAdmin}>
      <SnsFeedLayoutInner
        isAuthenticated={isAuthenticated}
        isAdmin={isAdmin}
      >
        {children}
      </SnsFeedLayoutInner>
    </SiteTourProvider>
  );
}

function SnsFeedLayoutInner({
  children,
  isAuthenticated = false,
  isAdmin = false,
}: SnsFeedLayoutProps) {
  const { startTour } = useSiteTour() ?? {};
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  useClickOutside(profileRef, closeProfile, profileOpen);

  const { chatOpen, toggleChat, totalUnread, setChatOpen, splitDockTop, bringChatDockToFront } =
    useChatPanel();
  const {
    groupOpen,
    setGroupOpen,
    closeGroup,
    refreshPicker,
    activeGroup,
  } = useGroupPanel();
  const [viewMode, setViewMode] = usePostViewMode();
  const pathname = usePathname();
  const groupRoute = parseGroupRoute(pathname);
  const groupId = groupRoute?.groupId ?? null;
  const isGroupContext = !!groupId;
  const isMeditationPage =
    pathname === "/meditation" || pathname.includes("/meditation");
  const isGroupChat =
    !!groupId && pathname.startsWith(`/group/${groupId}/chat`);
  const isFeedPage =
    pathname === "/feed" || /^\/group\/[^/]+\/feed$/.test(pathname);
  const showGroupPlus =
    isAuthenticated &&
    (pathname === "/group/mygroups" || groupOpen || isGroupContext);
  const mainMaxWidth =
    pathname === "/meditation" || pathname.includes("/meditation")
      ? meditationPageMaxWidthClass
      : isGroupChat
        ? "max-w-none"
        : "max-w-6xl";
  const [theme, setTheme] = useTheme();
  const [feedLayoutMode, setFeedLayoutMode] = useFeedLayoutMode();

  const onGroupTabClick = useCallback(() => {
    setProfileOpen(false);
    setChatOpen(false);
    refreshPicker();
    if (groupOpen) {
      closeGroup();
      return;
    }
    setGroupOpen(true);
  }, [
    groupOpen,
    closeGroup,
    refreshPicker,
    setGroupOpen,
    setChatOpen,
  ]);

  const navItems = useMemo(() => {
    const items: { label: string; href: string; icon: React.ReactNode }[] = [
      { label: "게시글", href: "/feed", icon: <FeedIcon /> },
      { label: "말씀묵상", href: "/meditation", icon: <BookHeartIcon /> },
      { label: "자료실", href: "/resources", icon: <ResourcesIcon /> },
      { label: "마이페이지", href: "/me", icon: <UserIcon /> },
    ];
    if (isAdmin) {
      items.push({ label: "관리자", href: "/admin", icon: <ShieldIcon /> });
    }
    return items;
  }, [isAdmin]);

  const groupNavItems = useMemo(() => {
    if (!groupId) return [];
    const items: { label: string; href: string; icon: React.ReactNode }[] = [
      { label: "소그룹 홈", href: groupPath(groupId, "feed"), icon: <FeedIcon /> },
      {
        label: "말씀묵상",
        href: groupPath(groupId, "meditation"),
        icon: <BookHeartIcon />,
      },
      {
        label: "말씀 기록",
        href: groupPath(groupId, "record"),
        icon: <RecordIcon />,
      },
      { label: "채팅", href: groupPath(groupId, "chat"), icon: <ChatIcon /> },
    ];
    if (activeGroup?.isAdmin) {
      items.push({
        label: "소그룹 관리",
        href: groupPath(groupId, "manage"),
        icon: <ShieldIcon />,
      });
    }
    return items;
  }, [groupId, activeGroup?.isAdmin]);

  const navBtnClass =
    "group/navbtn relative flex h-11 w-11 items-center justify-center rounded-xl text-ink transition hover:bg-accent-soft hover:text-accent-foreground";

  function navTip(label: string) {
    return (
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-1 text-sm font-medium text-ink opacity-0 shadow-md transition-opacity duration-150 group-hover/navbtn:opacity-100">
        {label}
      </span>
    );
  }

  function headerQuickTip(label: string) {
    return (
      <span className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink opacity-0 shadow-md transition-opacity duration-150 group-hover/quick:opacity-100">
        {label}
      </span>
    );
  }

  return (
    <FeedBrowseProvider groupId={groupId ?? undefined}>
    <PinnedAnnouncementProvider>
    <div
      className={`relative bg-bg pt-[var(--app-header-height)] ${
        isGroupChat ? "flex h-dvh flex-col overflow-hidden" : "min-h-screen pb-24"
      }`}
    >
      <header
        className={`fixed inset-x-0 top-0 z-40 ${appHeaderShellClass}`}
      >
        <div className={appHeaderRowClassName}>
          {isGroupContext && activeGroup ? (
            <GroupPickerButton
              name={activeGroup.name}
              image={activeGroup.image}
              onClick={onGroupTabClick}
              expanded={groupOpen}
              dataTour="logo"
            />
          ) : isAuthenticated ? (
            <div className="relative z-10 flex min-w-0 items-center gap-2 sm:gap-3">
              <LogoPickerButton
                onClick={onGroupTabClick}
                expanded={groupOpen}
                tip={navTip("소그룹")}
                dataTour="logo"
              />
              {!isGroupContext ? <PinnedNoticeHeaderTitle /> : null}
            </div>
          ) : (
            <Link
              href="/feed"
              className="relative z-10 flex shrink-0 items-center gap-3"
              aria-label="성경나눔장소"
            >
              <HeaderLogoGlyph />
            </Link>
          )}
          <AppHeaderCenter />
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            {isFeedPage ? (
              <button
                type="button"
                data-tour="header-feed-layout"
                onClick={() =>
                  setFeedLayoutMode(
                    feedLayoutMode === "daily" ? "timeline" : "daily",
                  )
                }
                className="group/quick relative flex h-10 w-10 items-center justify-center rounded-xl text-black transition-colors hover:text-accent dark:text-white dark:hover:text-accent"
                aria-label={
                  feedLayoutMode === "daily"
                    ? "연속 보기로 전환"
                    : "날짜별 보기로 전환"
                }
              >
                {feedLayoutMode === "daily" ? (
                  <FeedTimelineIcon />
                ) : (
                  <FeedDailyIcon />
                )}
                {headerQuickTip(
                  feedLayoutMode === "daily" ? "연속 보기" : "날짜별 보기",
                )}
              </button>
            ) : null}
            {isMeditationPage ? (
              <button
                type="button"
                data-tour="header-research"
                aria-disabled
                className="group/quick relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl text-black opacity-50 dark:text-white"
                aria-label="연구모드 coming soon.."
              >
                <ResearchModeIcon />
                {headerQuickTip("연구모드 coming soon..")}
              </button>
            ) : null}
            <button
              type="button"
              data-tour="header-theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="group/quick relative flex h-10 w-10 items-center justify-center rounded-xl text-black transition-colors hover:text-accent dark:text-white dark:hover:text-accent"
              aria-label={theme === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {headerQuickTip("테마")}
            </button>
            <button
              type="button"
              data-tour="header-view"
              onClick={() =>
                setViewMode(viewMode === "popup" ? "split" : "popup")
              }
              className="group/quick relative flex h-10 w-10 items-center justify-center rounded-xl text-black transition-colors hover:text-accent dark:text-white dark:hover:text-accent"
              aria-label={viewMode === "popup" ? "이분할로 보기" : "팝업으로 보기"}
            >
              {viewMode === "popup" ? <SplitViewIcon /> : <PopupViewIcon />}
              {headerQuickTip("뷰어 모드")}
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[var(--app-header-height)] z-50 hidden w-16 flex-col py-4 lg:flex">
        {isGroupContext ? (
          <>
            <div className="min-h-0 flex-1" />
            <nav className="flex flex-col items-center gap-2">
              {groupNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navBtnClass}
                  aria-label={item.label}
                  data-tour={groupNavTourId(item.href)}
                >
                  {item.icon}
                  {navTip(item.label)}
                </Link>
              ))}
            </nav>
            <div className="flex-1" />
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1" />
            <nav className="flex flex-col items-center gap-2">
              {navItems.map((item) => (
                <span key={`${item.label}-${item.href}`} className="contents">
                  <Link
                    href={item.href}
                    className={navBtnClass}
                    aria-label={item.label}
                    data-tour={mainNavTourId(item.href)}
                  >
                    {item.icon}
                    {navTip(item.label)}
                  </Link>
                  {item.href === "/me" && !isGroupContext ? (
                    <PinnedNoticeNavButton
                      navBtnClass={navBtnClass}
                      navTip={navTip}
                    />
                  ) : null}
                </span>
              ))}
            </nav>
            <div className="flex-1" />
          </>
        )}

        {isAuthenticated ? (
          <div className="relative flex justify-center pb-1">
            {showGroupPlus ? (
              <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2">
                <GroupNavActions />
              </div>
            ) : null}
            <button
              type="button"
              data-tour="nav-chat"
              onClick={() => {
                setProfileOpen(false);
                if (chatOpen && viewMode === "split" && splitDockTop !== "chat") {
                  bringChatDockToFront();
                  return;
                }
                toggleChat();
              }}
              className={`${navBtnClass} focus:outline-none`}
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
            data-tour="nav-more"
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
              className="absolute left-full top-1/2 z-50 ml-2 w-36 -translate-y-[calc(50%+35px)] overflow-hidden rounded-lg border border-line bg-surface py-0.5 shadow-lg"
              role="menu"
            >
              {isAuthenticated ? (
                <>
                  <Link
                    href={groupId ? groupPath(groupId, "settings") : "/settings"}
                    className="block px-3 py-2 text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    설정
                  </Link>
                  <Link
                    href="/"
                    className="block px-3 py-2 text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    성장 소개
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={() => {
                      closeProfile();
                      startTour?.();
                    }}
                  >
                    이용방법
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft"
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
                    className="block px-3 py-2 text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    회원가입
                  </Link>
                  <Link
                    href="/"
                    className="block px-3 py-2 text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={closeProfile}
                  >
                    성장 소개
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-ink hover:bg-accent-soft"
                    role="menuitem"
                    onClick={() => {
                      closeProfile();
                      startTour?.();
                    }}
                  >
                    이용방법
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </aside>

      <main
        className={`mx-auto w-full px-3 pt-[15px] sm:px-4 lg:pl-20 ${mainMaxWidth} ${
          isGroupChat ? "flex min-h-0 flex-1 flex-col overflow-hidden" : ""
        }`}
      >
        {children}
      </main>
    </div>
    </PinnedAnnouncementProvider>
    </FeedBrowseProvider>
  );
}
