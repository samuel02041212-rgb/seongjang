"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BookmarksPanel } from "@/components/me/bookmarks-panel";
import { ProfileEditModal } from "@/components/me/profile-edit-modal";
import { ProfilePageShell } from "@/components/me/profile-page-shell";
import { ProfilePostsPanel } from "@/components/me/profile-posts-panel";
import { ProfileAvatar } from "@/components/me/profile-avatar";
import { RecordPageClient } from "@/components/record/record-page-client";
import { mePageMainShellMinHeightClass } from "@/lib/feed-card-layout";

type MeJson = {
  id: string;
  name: string | null;
  church: string;
  statusMessage: string;
  image: string | null;
};

type MeTab = "posts" | "record" | "bookmarks";

function parseMeTab(value: string | null): MeTab {
  if (value === "record" || value === "bookmarks") return value;
  return "posts";
}

function RecordTabIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h8" />
    </svg>
  );
}

export function MePageClient() {
  const searchParams = useSearchParams();
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<MeTab>(() => parseMeTab(searchParams.get("tab")));
  const [me, setMe] = useState<MeJson | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setTab(parseMeTab(searchParams.get("tab")));
  }, [searchParams]);

  const displayName =
    me?.name?.trim() ||
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "회원";
  const avatarImage = me?.image ?? session?.user?.image ?? null;

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as MeJson | null;
      if (data) setMe(data);
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const userId = me?.id ?? session?.user?.id ?? "";

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center py-3 transition ${
      active ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink"
    }`;

  return (
    <ProfilePageShell userId={userId} sidePanelEditable>
      <section
        className={`flex w-full flex-col overflow-visible rounded-xl border border-line bg-surface shadow-sm ${mePageMainShellMinHeightClass}`}
      >
      <div className="border-b border-line p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ProfileAvatar
            image={avatarImage}
            editable
            onEdit={() => setEditOpen(true)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{displayName}</p>
            {me?.statusMessage?.trim() ? (
              <p className="mt-1 text-sm text-ink/90">{me.statusMessage.trim()}</p>
            ) : null}
            {me?.church ? (
              <p className="mt-1 text-sm text-muted">{me.church}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setTab("posts")}
          title="내 게시글"
          aria-label="내 게시글"
          className={tabClass(tab === "posts")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setTab("record")}
          title="말씀 기록"
          aria-label="말씀 기록"
          data-tour="profile-record-tab"
          className={tabClass(tab === "record")}
        >
          <RecordTabIcon />
        </button>
        <button
          type="button"
          onClick={() => setTab("bookmarks")}
          title="책깔피"
          aria-label="책깔피"
          className={tabClass(tab === "bookmarks")}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {tab === "posts" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ProfilePostsPanel
            postsUrl="/api/posts?mine=1"
            emptyMessage="아직 작성한 글이 없습니다."
            emptyAction={{ href: "/meditation", label: "말씀묵상 쓰기" }}
          />
        </div>
      ) : tab === "record" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <RecordPageClient
            postsUrl="/api/posts?mine=1"
            embedded
            todoUserId={userId}
            todosEditable
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-8">
          <BookmarksPanel />
        </div>
      )}

      <ProfileEditModal
        open={editOpen}
        initialName={me?.name ?? displayName}
        initialStatusMessage={me?.statusMessage ?? ""}
        initialImage={avatarImage}
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await loadMe();
          try {
            await updateSession();
          } catch {
            void 0;
          }
        }}
      />
        </section>
    </ProfilePageShell>
  );
}
