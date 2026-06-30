"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useChatPanel } from "@/components/chat/chat-dock";
import { ProfilePageShell } from "@/components/me/profile-page-shell";
import { ProfilePostsPanel } from "@/components/me/profile-posts-panel";
import { ProfileAvatar } from "@/components/me/profile-avatar";
import { RecordPageClient } from "@/components/record/record-page-client";
import { mePageMainShellMinHeightClass } from "@/lib/feed-card-layout";

type UserJson = {
  id: string;
  name: string | null;
  church: string;
  statusMessage: string;
  image: string | null;
};

type ProfileTab = "posts" | "record";

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

export function UserProfileClient({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openChatWithUser } = useChatPanel();
  const [tab, setTab] = useState<ProfileTab>("posts");
  const [user, setUser] = useState<UserJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatPending, setChatPending] = useState(false);

  useEffect(() => {
    if (session?.user?.id === userId) {
      router.replace("/me");
    }
  }, [session?.user?.id, userId, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
          credentials: "include",
        });
        if (cancelled) return;
        if (!res.ok) {
          setUser(null);
          return;
        }
        setUser((await res.json()) as UserJson);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = user?.name?.trim() || "회원";
  const postsUrl = `/api/posts?authorId=${encodeURIComponent(userId)}`;

  const onMessage = useCallback(async () => {
    if (!user || chatPending) return;
    setChatPending(true);
    try {
      await openChatWithUser({
        id: user.id,
        name: displayName,
        image: user.image,
      });
    } finally {
      setChatPending(false);
    }
  }, [user, chatPending, displayName, openChatWithUser]);

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center py-3 transition ${
      active ? "border-b-2 border-accent text-ink" : "text-muted hover:text-ink"
    }`;

  if (loading) {
    return (
      <ProfilePageShell userId={userId}>
        <section className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <p className="px-4 py-16 text-center text-sm text-muted sm:px-6">
            불러오는 중…
          </p>
        </section>
      </ProfilePageShell>
    );
  }

  if (!user) {
    return (
      <ProfilePageShell userId={userId}>
        <section className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <p className="px-4 py-16 text-center text-sm text-muted sm:px-6">
            사용자를 찾을 수 없습니다.
          </p>
        </section>
      </ProfilePageShell>
    );
  }

  return (
    <ProfilePageShell userId={userId}>
      <section
        className={`flex w-full flex-col overflow-visible rounded-xl border border-line bg-surface shadow-sm ${mePageMainShellMinHeightClass}`}
      >
      <div className="border-b border-line p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ProfileAvatar image={user.image} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink">{displayName}</p>
            {user.statusMessage?.trim() ? (
              <p className="mt-1 text-sm text-ink/90">
                {user.statusMessage.trim()}
              </p>
            ) : null}
            {user.church ? (
              <p className="mt-1 text-sm text-muted">{user.church}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void onMessage()}
              disabled={chatPending}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft disabled:opacity-60"
            >
              <svg
                width="18"
                height="18"
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
              {chatPending ? "여는 중…" : "메시지"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-line">
        <button
          type="button"
          onClick={() => setTab("posts")}
          title="게시글"
          aria-label="게시글"
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
          className={tabClass(tab === "record")}
        >
          <RecordTabIcon />
        </button>
      </div>

      {tab === "posts" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ProfilePostsPanel
            postsUrl={postsUrl}
            emptyMessage="아직 작성한 글이 없습니다."
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <RecordPageClient
            postsUrl={postsUrl}
            embedded
            todoUserId={userId}
          />
        </div>
      )}
        </section>
    </ProfilePageShell>
  );
}
