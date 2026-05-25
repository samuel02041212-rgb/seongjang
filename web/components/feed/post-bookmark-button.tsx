"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type PostBookmarkButtonProps = {
  postId: string;
  folderIds: string[];
  onChange: (folderIds: string[]) => void;
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function PostBookmarkButton({
  postId,
  folderIds,
  onChange,
}: PostBookmarkButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const saved = folderIds.length > 0;

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks/folders", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as FoldersResponse;
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch {
      void 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadFolders();
  }, [open, loadFolders]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggleFolder = async (folderId: string) => {
    const has = folderIds.includes(folderId);
    try {
      if (has) {
        const res = await fetch(
          `/api/bookmarks?postId=${encodeURIComponent(postId)}&folderId=${encodeURIComponent(folderId)}`,
          { method: "DELETE", credentials: "include" },
        );
        if (!res.ok) return;
        onChange(folderIds.filter((id) => id !== folderId));
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, folderId }),
        });
        if (!res.ok) return;
        onChange([...folderIds, folderId]);
      }
    } catch {
      void 0;
    }
  };

  const createFolder = async () => {
    const name = newName.trim();
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
      setFolders((prev) => [...prev, folder]);
      setNewName("");
      setAdding(false);
      await toggleFolder(folder.id);
    } catch {
      void 0;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={saved ? "책깔피됨" : "책깔피"}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center text-sm font-semibold transition ${
          saved ? "text-accent" : "text-muted hover:text-ink"
        }`}
      >
        <BookmarkIcon filled={saved} />
      </button>

      {open ? (
        <div
          className="absolute bottom-full right-0 z-40 mb-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <p className="px-2 py-1 text-xs font-semibold text-ink">책깔피</p>
          {loading ? (
            <p className="px-2 py-3 text-xs text-muted">불러오는 중…</p>
          ) : folders.length === 0 && !adding ? (
            <p className="px-2 py-2 text-xs text-muted">
              아직 책깔피가 없습니다.
            </p>
          ) : (
            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
              {folders.map((f) => {
                const checked = folderIds.includes(f.id);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                        checked
                          ? "bg-accent-soft font-medium text-ink"
                          : "text-ink hover:bg-bg"
                      }`}
                      onClick={() => void toggleFolder(f.id)}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          checked
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-line bg-surface"
                        }`}
                        aria-hidden
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span className="min-w-0 truncate">{f.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {adding ? (
            <div className="mt-2 space-y-2 border-t border-line pt-2">
              <input
                type="text"
                value={newName}
                maxLength={40}
                placeholder="책깔피 이름"
                autoFocus
                className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") void createFolder();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewName("");
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-md bg-accent px-2 py-1.5 text-xs font-semibold text-accent-foreground"
                  onClick={() => void createFolder()}
                >
                  추가
                </button>
                <button
                  type="button"
                  className="rounded-md border border-line px-2 py-1.5 text-xs text-muted"
                  onClick={() => {
                    setAdding(false);
                    setNewName("");
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mt-2 w-full rounded-md border border-dashed border-line py-2 text-xs font-medium text-muted hover:border-accent hover:text-ink"
              onClick={() => setAdding(true)}
            >
              + 책깔피 추가
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
