/**
 * 채팅: 모든 로그인 페이지에 공통. 목록 패널 + 최대 3개 채팅창.
 */
(function() {
  const MAX_WINDOWS = 3;
  let socket = null;
  let myUserId = null;
  const onlineUsers = new Set();
  const openWindows = []; // [ { roomId, otherUser, el, openedAt } ] 최대 3개, 인덱스 0이 가장 먼저 연 것
  const CHAT_UI_STORAGE_KEY = 'chat.ui.collapsed';
  const CHAT_WINDOWS_STORAGE_PREFIX = 'chat.windows.';

  function $(id) { return document.getElementById(id); }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }
  function getChatWindowsStorageKey() {
    return CHAT_WINDOWS_STORAGE_PREFIX + (myUserId || 'guest');
  }
  function getStoredCollapsed() {
    try {
      return localStorage.getItem(CHAT_UI_STORAGE_KEY) === '1';
    } catch (_) {
      return true;
    }
  }
  function setStoredCollapsed(isCollapsed) {
    try {
      localStorage.setItem(CHAT_UI_STORAGE_KEY, isCollapsed ? '1' : '0');
    } catch (_) {}
  }
  function saveOpenWindowsState() {
    if (!myUserId) return;
    try {
      const data = openWindows.slice(-MAX_WINDOWS).map(w => ({
        roomId: w.roomId,
        otherUser: w.otherUser || {},
        minimized: !!(w.el && w.el.classList.contains('minimized'))
      }));
      localStorage.setItem(getChatWindowsStorageKey(), JSON.stringify(data));
    } catch (_) {}
  }
  function readOpenWindowsState() {
    if (!myUserId) return [];
    try {
      const raw = localStorage.getItem(getChatWindowsStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(x => x && x.roomId).slice(-MAX_WINDOWS);
    } catch (_) {
      return [];
    }
  }

  function injectChat() {
    const wrap = $('chat-wrap');
    if (wrap) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/chat.css';
    document.head.appendChild(link);
    fetch('/partials/chat.html')
      .then(r => r.text())
      .then(html => {
        const div = document.createElement('div');
        div.innerHTML = html;
        const wrap = div.querySelector('#chat-wrap');
        const container = div.querySelector('#chat-windows-container');
        if (wrap) document.body.appendChild(wrap);
        if (container) document.body.appendChild(container);
        initChat();
      })
      .catch(console.error);
  }

  function initChat() {
    const wrap = $('chat-wrap');
    const panel = $('chat-panel');
    const toggle = $('chat-toggle');
    const container = $('chat-windows-container');
    if (!wrap || !panel) return;

    wrap.classList.toggle('collapsed', getStoredCollapsed());
    toggle.addEventListener('click', function() {
      wrap.classList.toggle('collapsed');
      setStoredCollapsed(wrap.classList.contains('collapsed'));
      syncWindowsOffset();
      updateToggleBadgeVisibility();
    });

    // initial placement of windows container relative to panel/toggle
    function syncWindowsOffset() {
      const isCollapsed = wrap.classList.contains('collapsed');
      const rightPx = isCollapsed ? 44 : (280 + 44); // panel width + toggle width
      if (container) container.style.right = rightPx + 'px';
    }
    function updateToggleBadgeVisibility() {
      const badge = toggle && toggle.querySelector('.chat-toggle-badge');
      if (!badge) return;
      const hasValue = (badge.textContent || '').trim() !== '' && badge.textContent !== '0';
      const isCollapsed = wrap.classList.contains('collapsed');
      badge.style.display = (isCollapsed && hasValue) ? 'flex' : 'none';
    }
    syncWindowsOffset();
    updateToggleBadgeVisibility();

    fetch('/api/me')
      .then(r => r.json())
      .then(me => {
        if (!me || !me._id) return;
        myUserId = String(me._id);
        fetch('/api/chat/online')
          .then(r => r.json())
          .then(ids => { ids.forEach(id => onlineUsers.add(String(id))); })
          .catch(function() {});
        loadRooms();
        restoreOpenWindows();
        connectSocket();
        setupSearch();
        setupContextMenu();
      })
      .catch(console.error);
  }

  function connectSocket() {
    fetch('/api/chat/socket-token')
      .then(r => r.json())
      .then(data => {
        if (!data.token) return;
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = function() {
          socket = window.io();
          socket.on('connect', function() {
            socket.emit('auth', data.token);
          });
          socket.on('user:online', function(id) {
            onlineUsers.add(String(id));
            refreshRoomListOnline();
            refreshWindowsOnline();
          });
          socket.on('user:offline', function(id) {
            onlineUsers.delete(String(id));
            refreshRoomListOnline();
            refreshWindowsOnline();
          });
          socket.on('chat:new_message', function(msg) {
            const roomId = [msg.senderId, msg.receiverId].map(String).sort().join('_');
            appendMessageToWindow(roomId, msg);
            loadRooms();
          });
        };
        document.head.appendChild(script);
      })
      .catch(console.error);
  }

  function loadRooms() {
    fetch('/api/chat/rooms')
      .then(r => r.json())
      .then(rooms => {
        const list = $('chat-room-list');
        const toggle = $('chat-toggle');
        if (!list) return;
        if (!rooms.length) {
          list.innerHTML = '<div class="chat-empty-list">채팅한 대화가 없어요.<br>위에서 사용자를 검색해 대화를 시작하세요.</div>';
          // reset toggle badge
          if (toggle) {
            const badgeEl = toggle.querySelector('.chat-toggle-badge');
            if (badgeEl) {
              badgeEl.textContent = '';
              badgeEl.style.display = 'none';
            }
          }
          return;
        }
        const totalUnread = rooms.reduce((sum, r) => sum + (Number(r.unreadCount) || 0), 0);
        if (toggle) {
          const badgeEl = toggle.querySelector('.chat-toggle-badge');
          if (badgeEl) {
            badgeEl.textContent = totalUnread > 0 ? String(totalUnread) : '';
          }
        }
        list.innerHTML = rooms.map(r => {
          const other = r.otherUser || {};
          const name = escapeHtml(other.username || '?');
          const preview = r.lastMessage ? escapeHtml(r.lastMessage.content.slice(0, 30)) + (r.lastMessage.content.length > 30 ? '…' : '') : '';
          const online = onlineUsers.has(String(other._id));
          const badge = r.unreadCount > 0 ? `<span class="chat-room-badge">${r.unreadCount}</span>` : '';
          return `<div class="chat-room-item" data-room-id="${escapeHtml(r.roomId)}" data-other-id="${escapeHtml(other._id)}" data-other-name="${name}" data-pinned="${r.pinned}">
            <div class="chat-room-avatar">${name.charAt(0)}</div>
            <div class="chat-room-body">
              <div class="chat-room-name">${name}</div>
              <div class="chat-room-preview">${preview}</div>
            </div>
            <div class="chat-room-meta">
              <span class="chat-room-status ${online ? 'online' : 'offline'}"></span>
              ${badge}
            </div>
          </div>`;
        }).join('');
        list.querySelectorAll('.chat-room-item').forEach(el => {
          el.addEventListener('click', function(e) {
            if (e.target.closest('.chat-context-menu')) return;
            const roomId = this.dataset.roomId;
            const otherUser = { _id: this.dataset.otherId, username: this.dataset.otherName };
            openWindow(roomId, otherUser);
          });
        });
        // show/hide toggle badge depending on collapsed state
        const wrap = $('chat-wrap');
        if (toggle) {
          const badgeEl = toggle.querySelector('.chat-toggle-badge');
          if (badgeEl) {
            const hasValue = (badgeEl.textContent || '').trim() !== '' && badgeEl.textContent !== '0';
            const isCollapsed = wrap && wrap.classList.contains('collapsed');
            badgeEl.style.display = (isCollapsed && hasValue) ? 'flex' : 'none';
          }
        }
      })
      .catch(console.error);
  }

  function refreshRoomListOnline() {
    $('chat-room-list').querySelectorAll('.chat-room-item').forEach(el => {
      const otherId = el.dataset.otherId;
      const dot = el.querySelector('.chat-room-status');
      if (dot) dot.className = 'chat-room-status ' + (onlineUsers.has(otherId) ? 'online' : 'offline');
    });
  }

  function refreshWindowsOnline() {
    openWindows.forEach(w => {
      const otherId = w.otherUser && w.otherUser._id;
      const dot = w.el && w.el.querySelector('.status-dot');
      if (dot) dot.className = 'status-dot ' + (onlineUsers.has(String(otherId)) ? 'online' : '');
    });
  }

  function setupSearch() {
    const input = $('chat-search');
    const results = $('chat-search-results');
    if (!input || !results) return;
    let timer = null;
    input.addEventListener('input', function() {
      clearTimeout(timer);
      const q = this.value.trim();
      if (!q) {
        results.style.display = 'none';
        return;
      }
      timer = setTimeout(function() {
        fetch('/api/chat/users/search?q=' + encodeURIComponent(q))
          .then(r => r.json())
          .then(users => {
            if (!users.length) {
              results.innerHTML = '<div class="chat-search-item">검색 결과 없음</div>';
            } else {
              results.innerHTML = users.map(u => `<div class="chat-search-item" data-user-id="${u._id}" data-username="${escapeHtml(u.username)}">${escapeHtml(u.username)}</div>`).join('');
              results.querySelectorAll('.chat-search-item[data-user-id]').forEach(el => {
                el.addEventListener('click', function() {
                  const otherUserId = this.dataset.userId;
                  const username = this.dataset.username;
                  input.value = '';
                  results.style.display = 'none';
                  fetch('/api/chat/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otherUserId }) })
                    .then(r => r.json())
                    .then(data => {
                      if (data.roomId) openWindow(data.roomId, { _id: otherUserId, username: username });
                      loadRooms();
                    });
                });
              });
            }
            results.style.display = 'block';
          });
      }, 300);
    });
    input.addEventListener('blur', function() {
      setTimeout(function() { results.style.display = 'none'; }, 200);
    });
  }

  function setupContextMenu() {
    document.addEventListener('contextmenu', function(e) {
      const item = e.target.closest('.chat-room-item');
      if (!item) return;
      e.preventDefault();
      const existing = document.querySelector('.chat-context-menu');
      if (existing) existing.remove();
      const pinned = item.dataset.pinned === 'true';
      const menu = document.createElement('div');
      menu.className = 'chat-context-menu';
      menu.style.left = e.pageX + 'px';
      menu.style.top = e.pageY + 'px';
      const btn = document.createElement('button');
      btn.textContent = pinned ? '고정 해제' : '고정';
      btn.addEventListener('click', function() {
        const roomId = item.dataset.roomId;
        const url = '/api/chat/rooms/' + encodeURIComponent(roomId) + '/pin';
        fetch(pinned ? url : url, { method: pinned ? 'DELETE' : 'POST' })
          .then(function() { loadRooms(); });
        menu.remove();
      });
      menu.appendChild(btn);
      document.body.appendChild(menu);
      function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
      setTimeout(function() { document.addEventListener('click', closeMenu); }, 0);
    });
  }

  function isWindowOpen(roomId) {
    return openWindows.some(w => w.roomId === roomId);
  }

  function restoreOpenWindows() {
    const stored = readOpenWindowsState();
    if (!stored.length) return;
    stored.forEach(item => {
      openWindow(item.roomId, item.otherUser || {}, { minimized: !!item.minimized, skipPersist: true });
    });
    saveOpenWindowsState();
  }

  function openWindow(roomId, otherUser, options) {
    const opts = options || {};
    if (isWindowOpen(roomId)) {
      const w = openWindows.find(x => x.roomId === roomId);
      if (w && w.el) {
        if (!opts.minimized) w.el.classList.remove('minimized');
        w.el.scrollIntoView({ block: 'nearest' });
      }
      fetch('/api/chat/rooms/' + encodeURIComponent(roomId) + '/open', { method: 'POST' }).then(function() { loadRooms(); });
      if (!opts.skipPersist) saveOpenWindowsState();
      return;
    }
    while (openWindows.length >= MAX_WINDOWS) {
      const old = openWindows.shift();
      if (old && old.el) old.el.remove();
    }
    fetch('/api/chat/rooms/' + encodeURIComponent(roomId) + '/open', { method: 'POST' }).then(function() { loadRooms(); });

    const container = $('chat-windows-container');
    if (!container) return;
    const win = document.createElement('div');
    win.className = 'chat-window';
    win.dataset.roomId = roomId;
    const name = escapeHtml(otherUser.username || '?');
    const online = onlineUsers.has(String(otherUser._id));
    win.innerHTML = `
      <div class="chat-window-header">
        <span class="chat-window-title"><span class="status-dot ${online ? 'online' : ''}"></span>${name}</span>
        <div class="chat-window-actions">
          <button type="button" class="chat-window-minimize" aria-label="최소화">−</button>
          <button type="button" class="chat-window-close" aria-label="닫기">✕</button>
        </div>
      </div>
      <div class="chat-window-body"></div>
      <div class="chat-window-footer">
        <form>
          <textarea placeholder="메시지 입력 (Enter 전송)" rows="1"></textarea>
          <button type="submit">전송</button>
        </form>
      </div>`;
    const body = win.querySelector('.chat-window-body');
    const form = win.querySelector('form');
    const textarea = form.querySelector('textarea');

    const header = win.querySelector('.chat-window-header');
    header.addEventListener('dblclick', function() {
      win.classList.toggle('minimized');
      saveOpenWindowsState();
    });
    win.querySelector('.chat-window-minimize').addEventListener('click', function(e) {
      e.stopPropagation();
      win.classList.toggle('minimized');
      saveOpenWindowsState();
    });
    const closeBtn = win.querySelector('.chat-window-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // remove from DOM and openWindows
        const idx = openWindows.findIndex(x => x.roomId === roomId);
        if (idx >= 0) openWindows.splice(idx, 1);
        win.remove();
        saveOpenWindowsState();
      });
    }

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const content = textarea.value.trim();
      if (!content || !socket) return;
      socket.emit('chat:message', { roomId, content });
      textarea.value = '';
    });
    textarea.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });

    // insert as first child so it appears at far right (row-reverse)
    if (container.firstChild) {
      container.insertBefore(win, container.firstChild);
    } else {
      container.appendChild(win);
    }
    const record = { roomId, otherUser, el: win, openedAt: Date.now() };
    openWindows.push(record);
    if (opts.minimized) win.classList.add('minimized');
    if (!opts.skipPersist) saveOpenWindowsState();

    fetch('/api/chat/rooms/' + encodeURIComponent(roomId) + '/messages')
      .then(r => r.json())
      .then(messages => {
        messages.forEach(m => appendMessageToWindow(roomId, m, body));
        body.scrollTop = body.scrollHeight;
      });

    body.scrollTop = body.scrollHeight;
  }

  function appendMessageToWindow(roomId, msg, bodyEl) {
    const w = openWindows.find(x => x.roomId === roomId);
    const body = bodyEl || (w && w.el && w.el.querySelector('.chat-window-body'));
    if (!body) return;
    const isMine = String(msg.senderId) === myUserId;
    const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '';
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (isMine ? 'mine' : 'theirs');
    div.innerHTML = '<div>' + escapeHtml(msg.content || '') + '</div><div class="chat-msg-time">' + time + '</div>';
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectChat);
  } else {
    injectChat();
  }
})();
