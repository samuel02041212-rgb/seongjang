"use client";

import { useCallback, useEffect, useState } from "react";

import { FeedPostRow } from "@/components/feed/feed-post-row";
import { PostDetailModal } from "@/components/feed/post-detail-modal";
import {
  feedPostListClass,
  feedPostListWrapClass,
} from "@/lib/feed-card-layout";
import type { FeedPostJson } from "@/lib/feed-serialize";

const ALL_FOLDER_ID = "all";

type BookmarkFolder = {
  id: string;
  name: string;
  sortOrder: number;
  count: number;
};

type FoldersResponse = {
  folders: BookmarkFolder[];
  allCount: number;
};

export function BookmarksPanel() {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [activeFolderId, setActiveFolderId] = useState(ALL_FOLDER_ID);
  const [posts, setPosts] = useState<FeedPostJson[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<FeedPostJson | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch("/api/bookmarks/folders", {
        credentials: "include",
      });
      if (!res.ok) {
        setFolders([]);
        setAllCount(0);
        return;
      }
      const data = (await res.json()) as FoldersResponse;
      const list = Array.isArray(data.folders) ? data.folders : [];
      setFolders(list);
      setAllCount(data.allCount ?? 0);
      setActiveFolderId((prev) => {
        if (prev === ALL_FOLDER_ID) return ALL_FOLDER_ID;
        if (list.some((f) => f.id === prev)) return prev;
        return ALL_FOLDER_ID;
      });
    } catch {
      setFolders([]);
      setAllCount(0);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const loadPosts = useCallback(async (folderId: string) => {
    setLoadingPosts(true);
    try {
      const res = await fetch(
        `/api/bookmarks?folderId=${encodeURIComponent(folderId)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = (await res.json()) as unknown;
      setPosts(Array.isArray(data) ? (data as FeedPostJson[]) : []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    void loadPosts(activeFolderId);
  }, [activeFolderId, loadPosts]);

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/bookmarks/folders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      const folder = (await res.json()) as BookmarkFolder;
      setNewFolderName("");
      setFolders((prev) => [...prev, folder]);
      setActiveFolderId(folder.id);
    } catch {
      void 0;
    }
  };

  const saveRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/bookmarks/folders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name } : f)),
      );
      setEditingId(null);
    } catch {
      void 0;
    }
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("이 책깔피와 저장된 글 목록을 삭제할까요?")) return;
    try {
      const res = await fetch(`/api/bookmarks/folders/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return;
      setFolders((prev) => {
        const next = prev.filter((f) => f.id !== id);
        setActiveFolderId((cur) =>
          cur === id ? ALL_FOLDER_ID : cur,
        );
        return next;
      });
      void loadFolders();
    } catch {
      void 0;
    }
  };

  const moveFolder = async (id: string, dir: -1 | 1) => {
    const idx = folders.findIndex((f) => f.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= folders.length) return;
    const a = folders[idx];
    const b = folders[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/bookmarks/folders/${encodeURIComponent(a.id)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: b.sortOrder }),
        }),
        fetch(`/api/bookmarks/folders/${encodeURIComponent(b.id)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: a.sortOrder }),
        }),
      ]);
      setFolders((prev) => {
        const next = [...prev];
        next[idx] = { ...b, sortOrder: a.sortOrder };
        next[swapIdx] = { ...a, sortOrder: b.sortOrder };
        return next.sort((x, y) => x.sortOrder - y.sortOrder);
      });
    } catch {
      void 0;
    }
  };

  const onLike = useCallback(async (postId: string) => {
    try {
      const res = await fetch(
        `/api/posts/${encodeURIComponent(postId)}/like`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) return;
      const body = (await res.json()) as {
        ok?: boolean;
        liked?: boolean;
        likeCount?: number;
      };
      if (!body.ok) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLikedByMe: body.liked ?? !p.isLikedByMe,
                likeCount: body.likeCount ?? p.likeCount,
              }
            : p,
        ),
      );
      setDetailPost((p) =>
        p?.id === postId
          ? {
              ...p,
              isLikedByMe: body.liked ?? !p.isLikedByMe,
              likeCount: body.likeCount ?? p.likeCount,
            }
          : p,
      );
    } catch {
      void 0;
    }
  }, []);

  const onBookmarkChange = useCallback(
    (postId: string, folderIds: string[]) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, bookmarkFolderIds: folderIds } : p,
        ),
      );
      setDetailPost((p) =>
        p?.id === postId ? { ...p, bookmarkFolderIds: folderIds } : p,
      );
    },
    [],
  );

  const bumpCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ),
    );
    setDetailPost((p) =>
      p?.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
    );
  }, []);

  if (loadingFolders) {
    return <p className="py-6 text-center text-sm text-muted">불러오는 중…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveFolderId(ALL_FOLDER_ID)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeFolderId === ALL_FOLDER_ID
                ? "bg-accent text-accent-foreground"
                : "border border-line bg-bg text-muted hover:text-ink"
            }`}
          >
            전체
            {allCount > 0 ? ` (${allCount})` : ""}
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFolderId(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeFolderId === f.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-line bg-bg text-muted hover:text-ink"
              }`}
            >
              {f.name}
              {f.count > 0 ? ` (${f.count})` : ""}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setManageOpen((v) => !v)}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
        >
          {manageOpen ? "관리 닫기" : "책깔피 관리"}
        </button>
      </div>

      {manageOpen ? (
        <div className="mb-6 rounded-lg border border-line bg-bg p-4">
          <p className="text-sm font-medium text-ink">책깔피 관리</p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newFolderName}
              maxLength={40}
              placeholder="새 책깔피 이름"
              className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void createFolder();
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
              onClick={() => void createFolder()}
            >
              추가
            </button>
          </div>
          {folders.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {folders.map((f, i) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3 py-2"
                >
                  {editingId === f.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        maxLength={40}
                        className="min-w-0 flex-1 rounded border border-line bg-bg px-2 py-1 text-sm"
                        autoFocus
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveRename(f.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        type="button"
                        className="text-xs font-medium text-ink"
                        onClick={() => void saveRename(f.id)}
                      >
                        저장
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {f.name}
                      </span>
                      <span className="text-xs text-muted">{f.count}개</span>
                      <button
                        type="button"
                        className="text-xs text-muted hover:text-ink"
                        aria-label="위로"
                        disabled={i === 0}
                        onClick={() => void moveFolder(f.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted hover:text-ink"
                        aria-label="아래로"
                        disabled={i === folders.length - 1}
                        onClick={() => void moveFolder(f.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted hover:text-ink"
                        onClick={() => {
                          setEditingId(f.id);
                          setEditName(f.name);
                        }}
                      >
                        이름 변경
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-700 hover:text-red-900"
                        onClick={() => void deleteFolder(f.id)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-muted">
              책깔피를 추가하면 피드에서 글을 모아볼 수 있습니다.
            </p>
          )}
        </div>
      ) : null}

      {loadingPosts ? (
        <p className="py-6 text-center text-sm text-muted">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {activeFolderId === ALL_FOLDER_ID
            ? "저장된 글이 없습니다."
            : "이 책깔피에 저장된 글이 없습니다."}
        </p>
      ) : (
        <div className={`${feedPostListWrapClass} ${feedPostListClass}`}>
          {posts.map((p) => (
            <FeedPostRow
              key={p.id}
              post={p}
              onOpenDetail={setDetailPost}
              onLike={onLike}
              showBookmark
              onBookmarkChange={onBookmarkChange}
            />
          ))}
        </div>
      )}

      <PostDetailModal
        post={detailPost}
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        onCommentAdded={() =>
          detailPost && bumpCommentCount(detailPost.id)
        }
        previewMode={false}
      />
    </div>
  );
}
