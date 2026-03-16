document.addEventListener('DOMContentLoaded', () => {
  // --- 프로필 표시 요소 ---
  const nameEl = document.getElementById('profileName');
  const statusEl = document.getElementById('profileStatus');
  const imgEl = document.querySelector('.profile-img img');

  // --- 모달 요소 ---
  const modal = document.getElementById('profileModal');
  const openBtn = document.getElementById('openProfileEdit');
  const closeBg = document.getElementById('profileModalClose');
  const closeX = document.getElementById('profileModalX');

  // --- 모달 내부 입력 ---
  const statusInput = document.getElementById('statusInput');
  const fileInput = document.getElementById('profileFile');
  const saveBtn = document.getElementById('saveProfileBtn');

  // 모달이 HTML에 없으면(아직 안 붙였으면) 여기서 바로 안내
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

  // --- 모달 열기/닫기 이벤트 ---
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBg) closeBg.addEventListener('click', closeModal);
  if (closeX) closeX.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // --- 1) 내 정보 로드 ---
  // 기존에 너가 쓰던 /me를 그대로 사용
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
    .catch((err) => {
      console.error(err);
    });

  // --- 2) 저장(상태메시지 + 사진 업로드) ---
  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
  e.stopPropagation();

      // (A) 상태메시지 저장
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

      // (B) 사진 업로드(선택)
      const file = fileInput?.files?.[0];
      if (file) {
        try {
          const fd = new FormData();
          fd.append('image', file); // 서버: upload.single('image') 기준

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
            console.log('사진업로드 응답:', data);

            // 업로드 성공 시 화면 반영 + 캐시 방지
            if (data?.profileImageUrl) {
              const imgEl2 = document.querySelector('.profile-img img');
              if (imgEl2) imgEl2.src = data.profileImageUrl + '?t=' + Date.now();
            }
          }
        } catch (err) {
          console.error('사진 업로드 실패:', err);
        }
      }

      // (C) 화면에 상태메시지 반영
      if (statusEl) statusEl.innerText = statusMessage || '상태 메세지를 설정해보세요';

      console.log('SAVE CLICKED');

      closeModal();
    });
  } else {
    console.error('saveProfileBtn 요소를 찾지 못했습니다.');
  }
});
