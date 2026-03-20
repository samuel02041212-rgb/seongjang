/**
 * public/js/mypage.js
 * 소그룹 마이페이지 전용: 프로필 표시, 프로필 수정 모달(상태메시지 + 프로필 사진 업로드).
 * DOMContentLoaded 후 /api/me 로 정보 로드, 저장 시 PUT /api/me + POST /api/me/profile-image.
 */
(function initMypage() {
  const nameEl = document.getElementById('profileName');
  const statusEl = document.getElementById('profileStatus');
  const imgEl = document.querySelector('.profile-img img');

  const modal = document.getElementById('profileModal');
  const openBtn = document.getElementById('openProfileEdit');
  const closeBg = document.getElementById('profileModalClose');
  const closeX = document.getElementById('profileModalX');

  const statusInput = document.getElementById('statusInput');
  const fileInput = document.getElementById('profileFile');
  const saveBtn = document.getElementById('saveProfileBtn');

  // Tabs
  const tabPosts = document.getElementById('tabPosts');
  const tabCalendar = document.getElementById('tabCalendar');
  const panelPosts = document.getElementById('panelPosts');
  const panelCalendar = document.getElementById('panelCalendar');

  function setActiveTab(which) {
    if (which === 'calendar') {
      tabCalendar?.classList.add('active');
      tabPosts?.classList.remove('active');
      if (panelCalendar) panelCalendar.style.display = '';
      if (panelPosts) panelPosts.style.display = 'none';
    } else {
      tabPosts?.classList.add('active');
      tabCalendar?.classList.remove('active');
      if (panelPosts) panelPosts.style.display = '';
      if (panelCalendar) panelCalendar.style.display = 'none';
    }
  }
  if (tabPosts) tabPosts.addEventListener('click', () => setActiveTab('posts'));
  if (tabCalendar) tabCalendar.addEventListener('click', () => setActiveTab('calendar'));

  if (!modal) {
    console.error('profileModal 요소가 없습니다. (모달 HTML이 마이페이지에 있어야 함)');
  }

  function openModal() {
    if (!modal) return;
    modal.style.display = 'block';
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBg) closeBg.addEventListener('click', closeModal);
  if (closeX) closeX.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // 내 정보 로드 → 이름/상태메시지/프로필 이미지 반영
  fetch('/api/me')
    .then(async (res) => {
      if (!res.ok) throw new Error('GET /api/me 실패: ' + res.status);
      return res.json();
    })
    .then((me) => {
      if (!me) return;
      if (nameEl) nameEl.innerText = me.username || '';
      if (statusEl) statusEl.innerText = me.statusMessage || '상태 메세지를 설정해보세요';
      if (imgEl) {
        imgEl.src = (me.profileImageUrl || '/images/default-profile.png') + '?t=' + Date.now();
      }
      if (statusInput) statusInput.value = me.statusMessage || '';
    })
    .catch((err) => console.error(err));

  // 저장: (A) 상태메시지 PUT (B) 사진 있으면 FormData로 업로드 (C) 화면 반영 후 모달 닫기
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const statusMessage = (statusInput?.value || '').trim();

      try {
        const r1 = await fetch('/api/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statusMessage })
        });
        if (!r1.ok) console.error('PUT /api/me 실패:', r1.status);
      } catch (err) {
        console.error('상태메시지 저장 실패:', err);
      }

      const file = fileInput?.files?.[0];
      if (file) {
        try {
          const fd = new FormData();
          fd.append('image', file);

          const r2 = await fetch('/api/me/profile-image', {
            method: 'POST',
            body: fd
          });

          const ct = r2.headers.get('content-type') || '';
          if (!ct.includes('application/json')) {
            const t = await r2.text();
            console.error('사진업로드 JSON 아님:', r2.status, t.slice(0, 120));
          } else {
            const data = await r2.json();
            if (data?.profileImageUrl) {
              const imgEl2 = document.querySelector('.profile-img img');
              if (imgEl2) imgEl2.src = data.profileImageUrl + '?t=' + Date.now();
            }
          }
        } catch (err) {
          console.error('사진 업로드 실패:', err);
        }
      }

      if (statusEl) statusEl.innerText = statusMessage || '상태 메세지를 설정해보세요';
      closeModal();
    });
  } else {
    console.error('saveProfileBtn 요소를 찾지 못했습니다.');
  }

  // ====== Calendar/Schedule (personal + global view) ======
  const calGrid = document.getElementById('calendarGrid');
  const calTitle = document.getElementById('calTitle');
  const dayTitle = document.getElementById('dayTitle');
  const dayCount = document.getElementById('dayCount');
  const dayList = document.getElementById('dayList');
  const btnPrev = document.getElementById('calPrev');
  const btnNext = document.getElementById('calNext');
  const btnToday = document.getElementById('calToday');
  const btnAdd = document.getElementById('calAdd');

  const schedModal = document.getElementById('scheduleModal');
  const schedCloseBg = document.getElementById('scheduleModalClose');
  const schedCloseX = document.getElementById('scheduleModalX');
  const schedCancel = document.getElementById('cancelScheduleBtn');
  const schedSave = document.getElementById('saveScheduleBtn');
  const schedDelete = document.getElementById('deleteScheduleBtn');
  const schedId = document.getElementById('scheduleId');
  const schedTitle = document.getElementById('scheduleTitle');
  const schedColor = document.getElementById('scheduleColor');
  const schedAllDay = document.getElementById('scheduleAllDay');
  const schedStart = document.getElementById('scheduleStart');
  const schedEnd = document.getElementById('scheduleEnd');
  const schedDesc = document.getElementById('scheduleDesc');

  function pad(n) { return String(n).padStart(2, '0'); }
  function toLocalInputValue(d) {
    const dt = new Date(d);
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()) + 'T' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
  }
  function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
  function fmtHM(d) {
    try { return new Date(d).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  }
  function fmtYMD(d) {
    const dt = new Date(d);
    return dt.getFullYear() + '.' + pad(dt.getMonth()+1) + '.' + pad(dt.getDate());
  }
  function esc(str) {
    return String(str ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'","&#039;");
  }

  let viewMonth = new Date();
  viewMonth.setDate(1);
  viewMonth.setHours(0,0,0,0);
  let selectedDate = startOfDay(new Date());
  let cachedEvents = [];

  function openSchedModal(mode, ev) {
    if (!schedModal) return;
    schedModal.style.display = 'block';
    const isEdit = mode === 'edit';
    if (schedId) schedId.value = isEdit ? String(ev._id) : '';
    if (schedTitle) schedTitle.value = isEdit ? (ev.title || '') : '';
    if (schedDesc) schedDesc.value = isEdit ? (ev.description || '') : '';
    if (schedColor) schedColor.value = isEdit ? (ev.color || '#ffcd38') : '#ffcd38';
    if (schedAllDay) schedAllDay.checked = isEdit ? !!ev.allDay : false;
    const baseStart = isEdit ? new Date(ev.startAt) : new Date(selectedDate);
    const baseEnd = isEdit ? new Date(ev.endAt) : new Date(selectedDate.getTime() + 60 * 60 * 1000);
    if (schedStart) schedStart.value = toLocalInputValue(baseStart);
    if (schedEnd) schedEnd.value = toLocalInputValue(baseEnd);
    if (schedDelete) schedDelete.style.display = (isEdit && ev.scope === 'personal') ? '' : 'none';
  }
  function closeSchedModal() {
    if (schedModal) schedModal.style.display = 'none';
  }
  schedCloseBg?.addEventListener('click', closeSchedModal);
  schedCloseX?.addEventListener('click', closeSchedModal);
  schedCancel?.addEventListener('click', closeSchedModal);

  async function fetchMonthEvents() {
    // range = calendar grid visible range (6 weeks)
    const first = new Date(viewMonth);
    const start = startOfDay(new Date(first.getFullYear(), first.getMonth(), 1));
    const gridStart = new Date(start);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = endOfDay(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + 42));
    const qs = new URLSearchParams({ from: gridStart.toISOString(), to: gridEnd.toISOString() });
    const res = await fetch('/api/schedule?' + qs.toString());
    cachedEvents = res.ok ? await res.json() : [];
  }

  function eventsForDay(d) {
    const from = startOfDay(d).getTime();
    const to = endOfDay(d).getTime();
    return cachedEvents.filter(ev => {
      const s = new Date(ev.startAt).getTime();
      const e = new Date(ev.endAt).getTime();
      return s <= to && e >= from;
    });
  }

  function renderCalendar() {
    if (!calGrid) return;
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    if (calTitle) calTitle.textContent = y + '.' + pad(m + 1);

    const dow = ['일','월','화','수','목','금','토'];
    const first = new Date(y, m, 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const cells = [];
    for (let i = 0; i < 7; i++) cells.push(`<div class="cal-dow">${dow[i]}</div>`);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const inMonth = d.getMonth() === m;
      const isSel = fmtYMD(d) === fmtYMD(selectedDate);
      const evs = eventsForDay(d);
      const dots = evs.slice(0, 6).map(ev => `<span class="cal-dot" style="background:${esc(ev.color || '#bbb')}"></span>`).join('');
      const more = evs.length > 6 ? `<div class="cal-more">+${evs.length - 6}</div>` : '';
      cells.push(`
        <div class="cal-cell ${inMonth ? '' : 'muted'} ${isSel ? 'selected' : ''}" data-date="${d.toISOString()}">
          <div class="cal-daynum"><span>${d.getDate()}</span>${evs.length ? `<span class="pill">${evs.length}</span>` : ''}</div>
          <div class="cal-dotrow">${dots}</div>
          ${more}
        </div>
      `);
    }
    calGrid.innerHTML = cells.join('');
  }

  function renderDay() {
    if (dayTitle) dayTitle.textContent = fmtYMD(selectedDate);
    const list = eventsForDay(selectedDate).sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
    if (dayCount) dayCount.textContent = list.length + '개';
    if (!dayList) return;
    if (!list.length) {
      dayList.innerHTML = `<div class="empty" style="padding:12px; color:#666;">일정이 없어요.</div>`;
      return;
    }
    dayList.innerHTML = list.map(ev => {
      const scopeLabel = ev.scope === 'global' ? '공용' : '내 일정';
      const timeLabel = ev.allDay ? '하루종일' : `${fmtHM(ev.startAt)} ~ ${fmtHM(ev.endAt)}`;
      const canEdit = ev.scope === 'personal';
      return `
        <div class="day-item" data-id="${esc(ev._id)}">
          <div class="evt-color" style="background:${esc(ev.color || '#bbb')}"></div>
          <div class="evt-body">
            <div class="evt-title">${esc(ev.title || '')}<span class="evt-scope">(${scopeLabel})</span></div>
            <div class="evt-meta">${esc(timeLabel)}${ev.description ? ' · ' + esc(ev.description) : ''}</div>
          </div>
          <div class="evt-actions">
            ${canEdit ? `<button class="evt-btn" data-act="edit">수정</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  async function reloadAndRender() {
    if (!panelCalendar) return;
    await fetchMonthEvents();
    renderCalendar();
    renderDay();
  }

  btnPrev?.addEventListener('click', async () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    await reloadAndRender();
  });
  btnNext?.addEventListener('click', async () => {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    await reloadAndRender();
  });
  btnToday?.addEventListener('click', async () => {
    selectedDate = startOfDay(new Date());
    viewMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    await reloadAndRender();
  });
  btnAdd?.addEventListener('click', () => openSchedModal('new'));

  calGrid?.addEventListener('click', (e) => {
    const cell = e.target.closest('.cal-cell');
    if (!cell?.dataset?.date) return;
    selectedDate = startOfDay(new Date(cell.dataset.date));
    renderCalendar();
    renderDay();
  });

  dayList?.addEventListener('click', (e) => {
    const act = e.target?.dataset?.act;
    if (!act) return;
    const item = e.target.closest('.day-item');
    if (!item?.dataset?.id) return;
    const ev = cachedEvents.find(x => String(x._id) === String(item.dataset.id));
    if (!ev) return;
    if (act === 'edit' && ev.scope === 'personal') openSchedModal('edit', ev);
  });

  schedSave?.addEventListener('click', async () => {
    const title = (schedTitle?.value || '').trim();
    const startAt = schedStart?.value ? new Date(schedStart.value) : null;
    const endAt = schedEnd?.value ? new Date(schedEnd.value) : null;
    if (!title || !startAt || !endAt || isNaN(startAt.getTime()) || isNaN(endAt.getTime()) || endAt.getTime() < startAt.getTime()) {
      return alert('제목/시작/끝을 확인해주세요.');
    }
    const payload = {
      title,
      description: (schedDesc?.value || '').trim(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      allDay: !!schedAllDay?.checked,
      color: schedColor?.value || '#ffcd38'
    };
    const id = (schedId?.value || '').trim();
    const res = await fetch(id ? ('/api/schedule/' + encodeURIComponent(id)) : '/api/schedule', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return alert('저장 실패');
    closeSchedModal();
    await reloadAndRender();
  });

  schedDelete?.addEventListener('click', async () => {
    const id = (schedId?.value || '').trim();
    if (!id) return;
    if (!confirm('이 일정을 삭제할까요?')) return;
    const res = await fetch('/api/schedule/' + encodeURIComponent(id), { method: 'DELETE' });
    if (!res.ok) return alert('삭제 실패');
    closeSchedModal();
    await reloadAndRender();
  });

  // calendar first paint only when user opens the tab
  let calendarLoaded = false;
  tabCalendar?.addEventListener('click', async () => {
    if (calendarLoaded) return;
    calendarLoaded = true;
    await reloadAndRender();
  });
})();
