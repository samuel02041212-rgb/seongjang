"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePostViewMode } from "@/lib/view-mode";

import { GroupRoomView } from "@/components/group/group-room-view";

const MAX_WINDOWS = 3;
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

type GroupListRoom = {
  groupId: string;
  groupName: string;
  groupImage: string | null;
  preview: string;
  lastMessageAt: string | null;
  pinned: boolean;
};

type GroupRoomApi = {
  groupId: string;
  groupName: string;
  groupImage: string | null;
  preview: string;
  lastMessageAt: string | null;
};

function groupPinKey(groupId: string) {
  return `g:${groupId}`;
}

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

type ChatPanelContextValue = {
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  toggleChat: () => void;
  openChatWithUser: (user: {
    id: string;
    name: string;
    image: string | null;
  }) => Promise<void>;
  totalUnread: number;
  splitDockTop: "chat" | "post";
  bringPostDockToFront: () => void;
  bringChatDockToFront: () => void;
};

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null);

export function useChatPanel() {
  const v = useContext(ChatPanelContext);
  if (!v) throw new Error("useChatPanel must be used within ChatProvider");
  return v;
}

function ChatChrome({
  variant,
  onClose,
  children,
  splitDockZ,
  onSplitPointerDown,
}: {
  variant: "popup" | "split";
  onClose: () => void;
  children: React.ReactNode;
  splitDockZ?: number;
  onSplitPointerDown?: () => void;
}) {
  if (variant === "split") {
    return (
      <>
        <button
          type="button"
          className="fixed inset-0 z-[29] cursor-default bg-transparent"
          aria-label="채팅 닫기"
          onClick={onClose}
        />
        <div
          className="chat-side-panel-wrap fixed right-0 top-[var(--app-header-height)] bottom-0 flex w-[min(90.25vw,45.6rem)] min-h-0 flex-col overflow-hidden border-l border-t border-line bg-surface shadow-xl"
          style={{ zIndex: splitDockZ ?? 30 }}
          role="dialog"
          aria-label="채팅"
          onPointerDownCapture={onSplitPointerDown}
        >
          {children}
        </div>
      </>
    );
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className="relative flex aspect-video min-h-0 w-[min(95vw,calc(95vh*16/9),80rem)] max-w-full flex-col overflow-hidden rounded-lg bg-surface shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="채팅"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [viewMode] = usePostViewMode();
  const [chatOpen, setChatOpen] = useState(false);
  const [splitDockTop, setSplitDockTop] = useState<"chat" | "post">("post");
  const bringPostDockToFront = useCallback(() => {
    setSplitDockTop("post");
  }, []);
  const bringChatDockToFront = useCallback(() => {
    setSplitDockTop("chat");
  }, []);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [rooms, setRooms] = useState<ChatListRoom[]>([]);
  const [groupRooms, setGroupRooms] = useState<GroupListRoom[]>([]);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    roomId: string;
    pinned: boolean;
  } | null>(null);
  const draftsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    setPinned(loadPinned());
  }, []);

  useEffect(() => {
    if (!chatOpen) setMenu(null);
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen && viewMode === "split") setSplitDockTop("chat");
  }, [chatOpen, viewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatOpen) setChatOpen(false);
    };
    if (chatOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [chatOpen]);

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

  const sortGroups = useCallback(
    (list: GroupListRoom[]) =>
      [...list].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const at = a.lastMessageAt ?? "";
        const bt = b.lastMessageAt ?? "";
        if (at !== bt) return bt.localeCompare(at);
        return a.groupName.localeCompare(b.groupName);
      }),
    [],
  );

  const loadGroupRooms = useCallback(async () => {
    if (!authed) return;
    try {
      const res = await fetch("/api/chat/group-rooms", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as GroupRoomApi[];
      if (!Array.isArray(data)) return;
      setGroupRooms(
        sortGroups(
          data.map<GroupListRoom>((g) => ({
            groupId: g.groupId,
            groupName: g.groupName,
            groupImage: g.groupImage,
            preview: g.preview,
            lastMessageAt: g.lastMessageAt,
            pinned: pinned.has(groupPinKey(g.groupId)),
          })),
        ),
      );
    } catch {
      void 0;
    }
  }, [pinned, sortGroups, authed]);

  const loadRooms = useCallback(async () => {
    if (!authed) return;
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
  }, [pinned, sortRooms, authed]);

  useEffect(() => {
    if (!authed) return;
    void loadRooms();
    void loadGroupRooms();
    const id = window.setInterval(() => {
      void loadRooms();
      void loadGroupRooms();
    }, ROOM_LIST_POLL_MS);
    return () => window.clearInterval(id);
  }, [authed, loadRooms, loadGroupRooms]);

  useEffect(() => {
    if (!authed) return;
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
  }, [search, authed]);

  const totalUnread = useMemo(
    () => rooms.reduce((s, r) => s + r.unreadCount, 0),
    [rooms],
  );

  const toggleChat = useCallback(() => {
    setChatOpen((v) => !v);
  }, []);

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
      setActiveGroupId(null);
      setActiveRoomId(target.roomId);
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

  const openGroup = useCallback((g: GroupListRoom) => {
    setActiveGroupId(g.groupId);
    setActiveRoomId(null);
  }, []);

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

  const openChatWithUser = useCallback(
    async (u: SearchUser) => {
      setChatOpen(true);
      bringChatDockToFront();
      await openByUser(u);
    },
    [openByUser, bringChatDockToFront],
  );

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

  const togglePin = (pinKey: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(pinKey)) next.delete(pinKey);
      else next.add(pinKey);
      persistPinned(next);
      return next;
    });
    setRooms((rs) =>
      sortRooms(
        rs.map((r) =>
          r.roomId === pinKey ? { ...r, pinned: !r.pinned } : r,
        ),
      ),
    );
    setGroupRooms((gs) =>
      sortGroups(
        gs.map((g) =>
          groupPinKey(g.groupId) === pinKey
            ? { ...g, pinned: !g.pinned }
            : g,
        ),
      ),
    );
  };

  const panelValue = useMemo<ChatPanelContextValue>(
    () => ({
      chatOpen: authed ? chatOpen : false,
      setChatOpen: (v) => {
        if (authed) setChatOpen(v);
      },
      toggleChat: () => {
        if (authed) setChatOpen((x) => !x);
      },
      openChatWithUser,
      totalUnread,
      splitDockTop,
      bringPostDockToFront,
      bringChatDockToFront,
    }),
    [
      authed,
      chatOpen,
      totalUnread,
      splitDockTop,
      bringPostDockToFront,
      bringChatDockToFront,
      openChatWithUser,
    ],
  );

  const activeWin = useMemo(() => {
    if (windows.length === 0) return null;
    const by = activeRoomId
      ? windows.find((w) => w.roomId === activeRoomId)
      : undefined;
    return by ?? windows[0];
  }, [windows, activeRoomId]);

  return (
    <ChatPanelContext.Provider value={panelValue}>
      {children}
      {authed && chatOpen ? (
        <ChatChrome
          variant={viewMode}
          splitDockZ={viewMode === "split" ? (splitDockTop === "chat" ? 40 : 30) : undefined}
          onSplitPointerDown={
            viewMode === "split" ? bringChatDockToFront : undefined
          }
          onClose={() => setChatOpen(false)}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <span className="text-sm font-medium text-muted">채팅</span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-muted hover:bg-accent-soft hover:text-ink"
              onClick={() => setChatOpen(false)}
              aria-label="채팅 닫기"
            >
              ×
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-row">
              <div
                className={
                  viewMode === "split"
                    ? "flex min-h-0 min-w-[12rem] w-[32%] max-w-[16rem] shrink-0 grow-0 flex-col border-r border-line"
                    : "flex min-h-0 min-w-0 flex-[1] flex-col border-r border-line"
                }
              >
                <div className="chat-panel-header shrink-0 border-b border-line">
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
                  <div className="chat-search-results max-h-[40%] shrink-0 overflow-y-auto border-b border-line">
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
                <div className="chat-room-list min-h-0 flex-1">
                  {rooms.length === 0 && groupRooms.length === 0 ? (
                    <div className="chat-empty-list">
                      대화 목록이 비어 있어요.
                      <br />
                      위에서 사용자를 검색하거나 소그룹 대화를 선택해 보세요.
                    </div>
                  ) : (
                    <>
                      {groupRooms.length > 0 ? (
                        <>
                          <div className="border-b border-line bg-bg/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            소그룹
                          </div>
                          {groupRooms.map((g) => {
                            const pinKey = groupPinKey(g.groupId);
                            const isActive = activeGroupId === g.groupId;
                            return (
                              <div
                                key={g.groupId}
                                className={`chat-room-item ${isActive ? "chat-room-item-active" : ""}`}
                                data-pinned={g.pinned ? "true" : "false"}
                                role="button"
                                tabIndex={0}
                                onClick={() => openGroup(g)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ")
                                    openGroup(g);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    roomId: pinKey,
                                    pinned: g.pinned,
                                  });
                                }}
                              >
                                <div className="chat-room-avatar">
                                  {g.groupImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={g.groupImage}
                                      alt=""
                                      className="h-full w-full rounded-full object-cover"
                                    />
                                  ) : (
                                    g.groupName.charAt(0)
                                  )}
                                </div>
                                <div className="chat-room-body">
                                  <div className="chat-room-name">
                                    {g.groupName}
                                  </div>
                                  <div className="chat-room-preview">
                                    {g.preview || "대화를 시작하세요."}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : null}
                      {rooms.length > 0 ? (
                        <>
                          <div className="border-b border-line bg-bg/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            개인
                          </div>
                          {rooms.map((r) => {
                            const isOpen = windows.some(
                              (w) => w.roomId === r.roomId,
                            );
                            const isActive =
                              isOpen &&
                              r.roomId === activeWin?.roomId &&
                              !activeGroupId;
                            return (
                              <div
                                key={r.roomId}
                                className={`chat-room-item ${isActive ? "chat-room-item-active" : ""}`}
                                data-pinned={r.pinned ? "true" : "false"}
                                role="button"
                                tabIndex={0}
                                onClick={() => openByRoom(r)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ")
                                    openByRoom(r);
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
                                  <div className="chat-room-name">
                                    {r.otherName}
                                  </div>
                                  <div className="chat-room-preview">
                                    {r.preview || "대화를 시작하세요."}
                                  </div>
                                </div>
                                <div className="chat-room-meta">
                                  {r.unreadCount > 0 ? (
                                    <span className="chat-room-badge">
                                      {r.unreadCount}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div
                className={
                  viewMode === "split"
                    ? "chat-pane-right flex min-h-0 min-w-0 flex-1 flex-col bg-bg"
                    : "chat-pane-right flex min-h-0 min-w-0 flex-[4] flex-col bg-bg"
                }
              >
                {activeGroupId ? (
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <GroupRoomView groupId={activeGroupId} compact />
                  </div>
                ) : windows.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center px-4 text-center text-sm text-muted">
                    왼쪽 목록에서 대화를 선택하거나
                    <br />
                    검색으로 새 대화를 시작하세요.
                  </div>
                ) : activeWin ? (
                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <ChatWindow
                      window={activeWin}
                      embedded
                      initialDraft={
                        draftsRef.current[activeWin.roomId] ?? ""
                      }
                      onDraftChange={(text) => {
                        draftsRef.current[activeWin.roomId] = text;
                      }}
                      onToggleMinimize={() =>
                        toggleMinimize(activeWin.roomId)
                      }
                      onSend={(text) => {
                        draftsRef.current[activeWin.roomId] = "";
                        void sendMessage(activeWin.roomId, text);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </ChatChrome>
      ) : null}

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
    </ChatPanelContext.Provider>
  );
}

function ChatWindow({
  window: w,
  embedded = false,
  initialDraft,
  onToggleMinimize,
  onSend,
  onDraftChange,
}: {
  window: OpenWindow;
  embedded?: boolean;
  initialDraft: string;
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

  const minimized = !embedded && w.minimized;

  return (
    <div
      className={`chat-window ${minimized ? "minimized" : ""} ${embedded ? "chat-window-embedded" : ""}`}
      data-room-id={w.roomId}
    >
      <div
        className="chat-window-header"
        role="presentation"
        onDoubleClick={embedded ? undefined : onToggleMinimize}
      >
        <span className="chat-window-title">{w.otherName}</span>
        {!embedded ? (
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
          </div>
        ) : null}
      </div>
      <div className="chat-window-body" ref={bodyRef}>
        {w.messages.length === 0 ? (
          <div className="chat-msg theirs text-muted text-sm">
            아직 대화가 없어요. 첫 메시지를 내보세요.
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
