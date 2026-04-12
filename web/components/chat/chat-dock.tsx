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

type ChatListRoom = {
  roomId: string;
  otherId: string;
  otherName: string;
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
  minimized: boolean;
  online: boolean;
  messages: Msg[];
};

export function ChatDock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [rooms, setRooms] = useState<ChatListRoom[]>([]);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    roomId: string;
    pinned: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      void 0;
    }
    setHydrated(true);
  }, []);

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

  const togglePanel = () => {
    persistCollapsed(!collapsed);
  };

  const openWindowForRoom = useCallback((r: ChatListRoom) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.roomId === r.roomId);
      if (existing) {
        return prev.map((w) =>
          w.roomId === r.roomId ? { ...w, minimized: false } : w,
        );
      }
      const next: OpenWindow = {
        roomId: r.roomId,
        otherId: r.otherId,
        otherName: r.otherName,
        minimized: false,
        online: r.online,
        messages: [],
      };
      const merged = [next, ...prev.filter((w) => w.roomId !== r.roomId)];
      return merged.slice(0, MAX_WINDOWS);
    });
    setRooms((rs) =>
      rs.map((x) =>
        x.roomId === r.roomId ? { ...x, unreadCount: 0 } : x,
      ),
    );
  }, []);

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
              id="chat-search"
              className="chat-search"
              placeholder="사용자 검색"
              autoComplete="off"
              value={search}
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
            <div
              id="chat-search-results"
              className="chat-search-results"
            >
              <div className="chat-search-item text-muted">
                검색은 채팅 API 연동 후 사용할 수 있습니다.
              </div>
            </div>
          ) : null}
          <div id="chat-room-list" className="chat-room-list">
            {rooms.length === 0 ? (
              <div className="chat-empty-list">
                대화 목록이 비어 있어요.
                <br />
                API 연동 후 여기에 방이 표시됩니다.
              </div>
            ) : (
              rooms.map((r) => (
                <div
                  key={r.roomId}
                  className="chat-room-item"
                  data-room-id={r.roomId}
                  data-other-id={r.otherId}
                  data-pinned={r.pinned ? "true" : "false"}
                  role="button"
                  tabIndex={0}
                  onClick={() => openWindowForRoom(r)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      openWindowForRoom(r);
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
                    {r.otherName.charAt(0)}
                  </div>
                  <div className="chat-room-body">
                    <div className="chat-room-name">{r.otherName}</div>
                    <div className="chat-room-preview">{r.preview}</div>
                  </div>
                  <div className="chat-room-meta">
                    <span
                      className={`chat-room-status ${r.online ? "online" : "offline"}`}
                    />
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
          <div
            key={w.roomId}
            className={`chat-window ${w.minimized ? "minimized" : ""}`}
            data-room-id={w.roomId}
          >
            <div
              className="chat-window-header"
              role="presentation"
              onDoubleClick={() => toggleMinimize(w.roomId)}
            >
              <span className="chat-window-title">
                <span
                  className={`status-dot ${w.online ? "online" : ""}`}
                />
                {w.otherName}
              </span>
              <div className="chat-window-actions">
                <button
                  type="button"
                  className="chat-window-minimize"
                  aria-label="최소화"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(w.roomId);
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
                    closeWindow(w.roomId);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="chat-window-body">
              {w.messages.length === 0 ? (
                <div className="chat-msg theirs text-muted text-sm">
                  메시지가 없습니다.
                </div>
              ) : (
                w.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-msg ${m.mine ? "mine" : "theirs"}`}
                  >
                    <div>{m.text}</div>
                    <div className="chat-msg-time">{m.time}</div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-window-footer">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <textarea
                  placeholder="메시지 입력 — API 연동 후"
                  rows={1}
                  readOnly
                />
                <button type="submit" disabled>
                  전송
                </button>
              </form>
            </div>
          </div>
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
                setRooms((rs) =>
                  rs.map((x) =>
                    x.roomId === menu.roomId
                      ? { ...x, pinned: !menu.pinned }
                      : x,
                  ),
                );
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
