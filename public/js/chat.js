/**
 * 채팅: 모든 로그인 페이지에 공통. 목록 패널 + 최대 3개 채팅창.
 */
(function() {
  const MAX_WINDOWS = 3;
  let socket = null;
  let myUserId = null;
  const onlineUsers = new Set();
  const openWindows = []; // [ { roomId, otherUser, el, openedAt } ] 최대 3개, 인덱스 0이 가장 먼저 연 것

  function $(id) { return document.getElementById(id); }
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
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
    if (!wrap || !panel) return;

    wrap.classList.add('collapsed');
    toggle.addEventListener('click', function() {
      wrap.classList.toggle('collapsed');
    });

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
        if (!list) return;
        if (!rooms.length) {
          list.innerHTML = '<div class="chat-empty-list">채팅한 대화가 없어요.<br>위에서 사용자를 검색해 대화를 시작하세요.</div>';
          return;
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

  function openWindow(roomId, otherUser) {
    if (isWindowOpen(roomId)) {
      const w = openWindows.find(x => x.roomId === roomId);
      if (w && w.el) {
        w.el.classList.remove('minimized');
        w.el.scrollIntoView({ block: 'nearest' });
      }
      fetch('/api/chat/rooms/' + encodeURIComponent(roomId) + '/open', { method: 'POST' }).then(function() { loadRooms(); });
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
        <button type="button" class="chat-window-minimize" aria-label="최소화">−</button>
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
    });
    win.querySelector('.chat-window-minimize').addEventListener('click', function(e) {
      e.stopPropagation();
      win.classList.toggle('minimized');
    });

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

    container.appendChild(win);
    const record = { roomId, otherUser, el: win, openedAt: Date.now() };
    openWindows.push(record);

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
