/**
 * 소그룹 패널: 개설 요청, 가입 요청, 대표용 가입 승인
 */
(function() {
  if (window.__groupPanelInitialized) return;
  window.__groupPanelInitialized = true;

  let joinSearchTimer = null;

  function esc(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function show(el) { if (el) el.style.display = 'block'; }
  function hide(el) { if (el) el.style.display = 'none'; }

  function refreshMyGroupLinks(host) {
    const box = host.querySelector('#myGroupLinks');
    if (!box) return;
    fetch('/api/my-groups')
      .then(r => r.json())
      .then(groups => {
        if (!groups || !groups.length) {
          box.innerHTML = '<div style="color:#666; font-size:12px; padding:6px 8px;">가입한 소그룹이 없어요.</div>';
          return;
        }
        box.innerHTML = groups.map(g =>
          `<a class="subnav-link" href="/group/${esc(g.slug)}">${esc(g.name || '')}</a>`
        ).join('');
      })
      .catch(function() {});
  }

  async function refreshLeaderBanner(host) {
    const banner = host.querySelector('#leaderJoinBanner');
    if (!banner) return;
    try {
      const res = await fetch('/api/groups/leader/join-requests');
      if (!res.ok) throw new Error();
      const list = await res.json();
      if (!list.length) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
      }
      banner.style.display = 'block';
      banner.innerHTML = `
        <strong>가입 대기 ${list.length}건</strong>
        <button type="button" id="btnOpenLeaderModal">처리하기</button>
      `;
    } catch (_) {
      banner.style.display = 'none';
    }
  }

  function afterSubnavMount(container) {
    if (!container) return;
    refreshMyGroupLinks(container);
    refreshLeaderBanner(container);
  }

  document.addEventListener('groupSubnavMounted', function(e) {
    afterSubnavMount(e.detail && e.detail.container);
  });

  // PJAX로 인해 이벤트가 먼저 발생한 케이스를 대비해 초기 1회 동기 로드
  try {
    const existing = document.getElementById('groupSubNav');
    if (existing) afterSubnavMount(existing);
  } catch (_) {}

  document.addEventListener('click', function(e) {
    if (e.target.id === 'btnGroupCreate') {
      const m = document.getElementById('modalGroupCreate');
      show(m);
      document.getElementById('createGroupName').value = '';
      document.getElementById('createGroupChurch').value = '';
      document.getElementById('createGroupBible').value = '';
      return;
    }
    if (e.target.id === 'btnGroupJoin') {
      const m = document.getElementById('modalGroupJoin');
      show(m);
      document.getElementById('joinGroupSearch').value = '';
      document.getElementById('joinGroupResults').innerHTML = '';
      document.getElementById('joinGroupResults').classList.remove('show');
      document.getElementById('joinSelectedWrap').style.display = 'none';
      document.getElementById('joinSelectedGroupId').value = '';
      return;
    }
    if (e.target.id === 'btnOpenLeaderModal') {
      openLeaderModal();
      return;
    }
    if (e.target.dataset.closeCreate !== undefined) {
      hide(document.getElementById('modalGroupCreate'));
      return;
    }
    if (e.target.dataset.closeJoin !== undefined) {
      hide(document.getElementById('modalGroupJoin'));
      return;
    }
    if (e.target.dataset.closeLeader !== undefined) {
      hide(document.getElementById('modalLeaderJoin'));
      return;
    }
    if (e.target.id === 'btnSubmitCreateRequest') {
      submitCreateRequest();
      return;
    }
    if (e.target.id === 'btnSubmitJoinRequest') {
      submitJoinRequest();
      return;
    }
    if (e.target.classList && e.target.classList.contains('join-result-item')) {
      const id = e.target.dataset.id;
      const name = e.target.dataset.name || '';
      const slug = e.target.dataset.slug || '';
      document.getElementById('joinSelectedGroupId').value = id;
      document.getElementById('joinSelectedInfo').innerHTML =
        '<b>' + esc(name) + '</b> <span style="color:#666;">/' + esc(slug) + '</span>';
      document.getElementById('joinSelectedWrap').style.display = 'block';
      document.getElementById('joinGroupResults').classList.remove('show');
      return;
    }
    const act = e.target.closest('[data-lj-act]');
    if (act) {
      const id = act.dataset.id;
      const action = act.dataset.ljAct;
      if (action === 'approve') leaderApprove(id);
      if (action === 'reject') leaderReject(id);
    }
  });

  function submitCreateRequest() {
    const name = (document.getElementById('createGroupName').value || '').trim();
    const church = (document.getElementById('createGroupChurch').value || '').trim();
    const bibleVerse = (document.getElementById('createGroupBible').value || '').trim();
    if (!name || !church || !bibleVerse) return alert('세 항목을 모두 입력해주세요.');

    fetch('/api/group-creation-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, church, bibleVerse })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          alert('개설 요청이 접수되었습니다. 관리자 승인을 기다려주세요.');
          hide(document.getElementById('modalGroupCreate'));
        } else if (data.reason === 'already_pending') {
          alert('이미 처리 대기 중인 개설 요청이 있습니다.');
        } else {
          alert('요청에 실패했습니다.');
        }
      })
      .catch(function() { alert('요청에 실패했습니다.'); });
  }

  function submitJoinRequest() {
    const groupId = (document.getElementById('joinSelectedGroupId').value || '').trim();
    const message = (document.getElementById('joinRequestMessage').value || '').trim();
    if (!groupId) return alert('소그룹을 검색해서 선택해주세요.');

    fetch('/api/groups/join-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, message })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          alert('가입 요청을 보냈습니다. 대표 승인을 기다려주세요.');
          hide(document.getElementById('modalGroupJoin'));
        } else if (data.reason === 'already_member') {
          alert('이미 가입한 소그룹입니다.');
        } else if (data.reason === 'already_pending') {
          alert('이미 가입 요청이 접수되어 있습니다.');
        } else {
          alert('요청에 실패했습니다.');
        }
      })
      .catch(function() { alert('요청에 실패했습니다.'); });
  }

  document.addEventListener('input', function(e) {
    if (e.target.id !== 'joinGroupSearch') return;
    const q = e.target.value.trim();
    const results = document.getElementById('joinGroupResults');
    clearTimeout(joinSearchTimer);
    if (!q) {
      results.innerHTML = '';
      results.classList.remove('show');
      return;
    }
    joinSearchTimer = setTimeout(function() {
      fetch('/api/groups/search?q=' + encodeURIComponent(q))
        .then(r => r.json())
        .then(list => {
          if (!list.length) {
            results.innerHTML = '<div class="join-result-item" style="cursor:default;color:#888;">검색 결과가 없어요.</div>';
            results.classList.add('show');
            return;
          }
          results.innerHTML = list.map(g =>
            `<div class="join-result-item" data-id="${esc(g._id)}" data-name="${esc(g.name)}" data-slug="${esc(g.slug)}">${esc(g.name)} <small style="color:#888">/${esc(g.slug)}</small></div>`
          ).join('');
          results.classList.add('show');
        });
    }, 300);
  });

  async function openLeaderModal() {
    const m = document.getElementById('modalLeaderJoin');
    const listEl = document.getElementById('leaderJoinList');
    listEl.innerHTML = '불러오는 중...';
    show(m);
    try {
      const res = await fetch('/api/groups/leader/join-requests');
      const list = res.ok ? await res.json() : [];
      if (!list.length) {
        listEl.innerHTML = '<p style="color:#666;">대기 중인 가입 요청이 없습니다.</p>';
        return;
      }
      listEl.innerHTML = list.map(function(r) {
        const uname = (r.user && r.user.username) || '?';
        const gname = (r.group && r.group.name) || '?';
        const msg = r.message ? '<div style="color:#666;margin-top:4px;">' + esc(r.message) + '</div>' : '';
        return `
          <div class="lj-item">
            <div><b>${esc(uname)}</b> → ${esc(gname)}</div>
            ${msg}
            <div class="lj-btns">
              <button type="button" data-lj-act="approve" data-id="${esc(r._id)}">승인</button>
              <button type="button" data-lj-act="reject" data-id="${esc(r._id)}">거절</button>
            </div>
          </div>
        `;
      }).join('');
    } catch (_) {
      listEl.innerHTML = '<p style="color:#c00;">불러오기 실패</p>';
    }
  }

  function leaderApprove(id) {
    if (!confirm('이 가입 요청을 승인할까요?')) return;
    fetch('/api/groups/join-requests/' + encodeURIComponent(id) + '/approve', { method: 'POST' })
      .then(r => r.json())
      .then(function(data) {
        if (data.ok) {
          openLeaderModal();
          var host = document.getElementById('groupSubNav');
          if (host) {
            refreshMyGroupLinks(host);
            refreshLeaderBanner(host);
          }
        } else alert('승인 실패');
      });
  }

  function leaderReject(id) {
    if (!confirm('가입 요청을 거절할까요?')) return;
    fetch('/api/groups/join-requests/' + encodeURIComponent(id) + '/reject', { method: 'POST' })
      .then(r => r.json())
      .then(function(data) {
        if (data.ok) {
          openLeaderModal();
          var host2 = document.getElementById('groupSubNav');
          if (host2) refreshLeaderBanner(host2);
        } else alert('처리 실패');
      });
  }

  window.GroupPanel = { afterSubnavMount: afterSubnavMount };
})();
