"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MAX_WINDOWS = 3;
const COLLAPSED_KEY = "chat.ui.collapsed";
const PINS_KEY = "chat.ui.pinned";
const ROOM_LIST_POLL_MS = 10000;
const MESSAGE_POLL_MS = 4000;

type ChatListRoom = {
  roomId: string;
  otherId: string;
  otherName: string;
  otherImage?: string | null;
  preview: string;
  unreadCount: number;
  pinned: boolean;
  online: boolean;
};

type Msg = { id: string; mine: boolean; text: string; time: string };

type OpenWindow = {
  roomId: string;
  otherId: string;
  otherName: string;
  otherImage: string | null;
  minimized: boolean;
  messages: Msg[];
};

type SearchUser = { id: string; name: string; image: string | null };

type RoomApi = {
  roomId: string;
  otherId: string;
  otherName: string;
  otherImage: string | null;
  preview: string;
  lastMessageAt: string | null;
  unreadCount: number;
};

function loadPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr)
      ? new Set(arr.filter((x): x is string => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistPinned(set: Set<string>) {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify([...set]));
  } catch {
    void 0;
  }
}

export function ChatDock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [rooms, setRooms] = useState<ChatListRoom[]>([]);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    roomId: string;
    pinned: boolean;
  } | null>(null);
  const draftsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      void 0;
    }
    setPinned(loadPinned());
    setHydrated(true);
  }, []);

  const sortRooms = useCallback(
    (list: ChatListRoom[]) =>
      [...list].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.unreadCount !== b.unreadCount)
          return b.unreadCount - a.unreadCount;
        return a.otherName.localeCompare(b.otherName);
      }),
    [],
  );

  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/rooms", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as RoomApi[];
      if (!Array.isArray(data)) return;
      const next = data.map<ChatListRoom>((r) => ({
        roomId: r.roomId,
        otherId: r.otherId,
        otherName: r.otherName,
        otherImage: r.otherImage,
        preview: r.preview,
        unreadCount: r.unreadCount,
        pinned: pinned.has(r.roomId),
        online: false,
      }));
      setRooms(sortRooms(next));
    } catch {
      void 0;
    }
  }, [pinned, sortRooms]);

  useEffect(() => {
    if (!hydrated) return;
    void loadRooms();
    const id = window.setInterval(loadRooms, ROOM_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [hydrated, loadRooms]);

  useEffect(() => {
    if (!hydrated) return;
    const q = search.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/chat/users?q=${encodeURIComponent(q)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as SearchUser[];
        if (!cancelled && Array.isArray(data)) setSearchResults(data);
      } catch {
        void 0;
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [search, hydrated]);

  const totalUnread = useMemo(
    () => rooms.reduce((s, r) => s + r.unreadCount, 0),
    [rooms],
  );

  const syncOffset = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rightPx = collapsed ? 44 : 280 + 44;
    el.style.right = `${rightPx}px`;
  }, [collapsed]);

  useEffect(() => {
    syncOffset();
  }, [collapsed, syncOffset]);

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      void 0;
    }
  }, []);

  const togglePanel = () => persistCollapsed(!collapsed);

  const loadMessages = useCallback(
    async (roomId: string) => {
      try {
        const res = await fetch(
          `/api/chat/rooms/${encodeURIComponent(roomId)}/messages`,
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Msg[];
        if (!Array.isArray(data)) return;
        setWindows((prev) =>
          prev.map((w) =>
            w.roomId === roomId ? { ...w, messages: data } : w,
          ),
        );
        setRooms((rs) =>
          sortRooms(
            rs.map((r) =>
              r.roomId === roomId ? { ...r, unreadCount: 0 } : r,
            ),
          ),
        );
      } catch {
        void 0;
      }
    },
    [sortRooms],
  );

  const openWindow = useCallback(
    (target: {
      roomId: string;
      otherId: string;
      otherName: string;
      otherImage: string | null;
    }) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.roomId === target.roomId);
        if (existing) {
          return prev.map((w) =>
            w.roomId === target.roomId ? { ...w, minimized: false } : w,
          );
        }
        const next: OpenWindow = {
          ...target,
          minimized: false,
          messages: [],
        };
        const merged = [
          next,
          ...prev.filter((w) => w.roomId !== target.roomId),
        ];
        return merged.slice(0, MAX_WINDOWS);
      });
      void loadMessages(target.roomId);
    },
    [loadMessages],
  );

  const openByRoom = useCallback(
    (r: ChatListRoom) => {
      openWindow({
        roomId: r.roomId,
        otherId: r.otherId,
        otherName: r.otherName,
        otherImage: r.otherImage ?? null,
      });
    },
    [openWindow],
  );

  const openByUser = useCallback(
    async (u: SearchUser) => {
      try {
        const res = await fetch("/api/chat/rooms", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherUserId: u.id }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          roomId: string;
          otherId: string;
          otherName: string;
          otherImage: string | null;
        };
        openWindow(data);
        setSearch("");
        setShowSearchResults(false);
        void loadRooms();
      } catch {
        void 0;
      }
    },
    [openWindow, loadRooms],
  );

  const closeWindow = (roomId: string) => {
    setWindows((prev) => prev.filter((w) => w.roomId !== roomId));
  };

  const toggleMinimize = (roomId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.roomId === roomId ? { ...w, minimized: !w.minimized } : w,
      ),
    );
  };

  useEffect(() => {
    if (windows.length === 0) return;
    const id = window.setInterval(() => {
      windows.forEach((w) => {
        if (!w.minimized) void loadMessages(w.roomId);
      });
    }, MESSAGE_POLL_MS);
    return () => window.clearInterval(id);
  }, [windows, loadMessages]);

  async function sendMessage(roomId: string, text: string) {
    if (!text.trim()) return;
    try {
      const res = await fetch(
        `/api/chat/rooms/${encodeURIComponent(roomId)}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text.trim() }),
        },
      );
      if (!res.ok) return;
      const msg = (await res.json()) as Msg;
      setWindows((prev) =>
        prev.map((w) =>
          w.roomId === roomId
            ? { ...w, messages: [...w.messages, msg] }
            : w,
        ),
      );
      void loadRooms();
    } catch {
      void 0;
    }
  }

  const togglePin = (roomId: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      persistPinned(next);
      return next;
    });
    setRooms((rs) =>
      sortRooms(
        rs.map((r) =>
          r.roomId === roomId ? { ...r, pinned: !r.pinned } : r,
        ),
      ),
    );
  };

  if (!hydrated) return null;

  return (
    <>
      <div
        id="chat-wrap"
        className={collapsed ? "collapsed" : ""}
        suppressHydrationWarning
      >
        <button
          type="button"
          id="chat-toggle"
          className="chat-toggle"
          aria-label="채팅 열기"
          onClick={togglePanel}
        >
          💬
          <span
            className="chat-toggle-badge"
            data-visible={
              collapsed && totalUnread > 0 ? "true" : "false"
            }
          >
            {totalUnread > 0 ? (totalUnread > 9 ? "9+" : totalUnread) : ""}
          </span>
        </button>
        <div id="chat-panel" className="chat-panel">
          <div className="chat-panel-header">
            <input
              type="text"
              className="chat-search"
              placeholder="사용자 검색 (이름·이메일)"
              autoComplete="off"
              value={search}
              onFocus={() => {
                if (search.trim()) setShowSearchResults(true);
              }}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearchResults(!!e.target.value.trim());
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchResults(false), 200);
              }}
            />
          </div>
          {showSearchResults && search.trim() ? (
            <div className="chat-search-results">
              {searchResults.length === 0 ? (
                <div className="chat-search-item text-muted">
                  검색 결과가 없습니다.
                </div>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    className="chat-search-item"
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void openByUser(u);
                    }}
                  >
                    <div className="chat-room-avatar">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        u.name.charAt(0)
                      )}
                    </div>
                    <span>{u.name}</span>
                  </div>
                ))
              )}
            </div>
          ) : null}
          <div className="chat-room-list">
            {rooms.length === 0 ? (
              <div className="chat-empty-list">
                대화 목록이 비어 있어요.
                <br />
                위에서 사용자를 검색해 대화를 시작해 보세요.
              </div>
            ) : (
              rooms.map((r) => (
                <div
                  key={r.roomId}
                  className="chat-room-item"
                  data-pinned={r.pinned ? "true" : "false"}
                  role="button"
                  tabIndex={0}
                  onClick={() => openByRoom(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openByRoom(r);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      roomId: r.roomId,
                      pinned: r.pinned,
                    });
                  }}
                >
                  <div className="chat-room-avatar">
                    {r.otherImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.otherImage}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      r.otherName.charAt(0)
                    )}
                  </div>
                  <div className="chat-room-body">
                    <div className="chat-room-name">{r.otherName}</div>
                    <div className="chat-room-preview">
                      {r.preview || "대화를 시작하세요."}
                    </div>
                  </div>
                  <div className="chat-room-meta">
                    {r.unreadCount > 0 ? (
                      <span className="chat-room-badge">{r.unreadCount}</span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div id="chat-windows-container" ref={containerRef}>
        {windows.map((w) => (
          <ChatWindow
            key={w.roomId}
            window={w}
            initialDraft={draftsRef.current[w.roomId] ?? ""}
            onDraftChange={(text) => {
              draftsRef.current[w.roomId] = text;
            }}
            onClose={() => closeWindow(w.roomId)}
            onToggleMinimize={() => toggleMinimize(w.roomId)}
            onSend={(text) => {
              draftsRef.current[w.roomId] = "";
              void sendMessage(w.roomId, text);
            }}
          />
        ))}
      </div>

      {menu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[99998] cursor-default bg-transparent"
            aria-label="메뉴 닫기"
            onClick={() => setMenu(null)}
          />
          <div
            className="chat-context-menu"
            style={{ left: menu.x, top: menu.y }}
          >
            <button
              type="button"
              onClick={() => {
                togglePin(menu.roomId);
                setMenu(null);
              }}
            >
              {menu.pinned ? "고정 해제" : "고정"}
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

function ChatWindow({
  window: w,
  initialDraft,
  onClose,
  onToggleMinimize,
  onSend,
  onDraftChange,
}: {
  window: OpenWindow;
  initialDraft: string;
  onClose: () => void;
  onToggleMinimize: () => void;
  onSend: (text: string) => void;
  onDraftChange: (text: string) => void;
}) {
  const [text, setText] = useState(initialDraft);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [w.messages.length]);

  return (
    <div
      className={`chat-window ${w.minimized ? "minimized" : ""}`}
      data-room-id={w.roomId}
    >
      <div
        className="chat-window-header"
        role="presentation"
        onDoubleClick={onToggleMinimize}
      >
        <span className="chat-window-title">{w.otherName}</span>
        <div className="chat-window-actions">
          <button
            type="button"
            className="chat-window-minimize"
            aria-label="최소화"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
          >
            −
          </button>
          <button
            type="button"
            className="chat-window-close"
            aria-label="닫기"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <div className="chat-window-body" ref={bodyRef}>
        {w.messages.length === 0 ? (
          <div className="chat-msg theirs text-muted text-sm">
            아직 대화가 없어요. 첫 메시지를 보내보세요.
          </div>
        ) : (
          w.messages.map((m) => (
            <div
              key={m.id}
              className={`chat-msg ${m.mine ? "mine" : "theirs"}`}
            >
              <div>{m.text}</div>
              <div className="chat-msg-time">
                {new Date(m.time).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="chat-window-footer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = text.trim();
            if (!trimmed) return;
            onSend(trimmed);
            setText("");
            onDraftChange("");
          }}
        >
          <textarea
            placeholder="메시지 입력"
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onDraftChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const trimmed = text.trim();
                if (!trimmed) return;
                onSend(trimmed);
                setText("");
                onDraftChange("");
              }
            }}
          />
          <button type="submit" disabled={!text.trim()}>
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
