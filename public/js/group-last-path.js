/**
 * 소그룹 헤더 아이콘(#groupNavLink)이 마지막으로 본 소그룹 화면으로 이동하도록 localStorage에 경로를 둡니다.
 * 스크립트는 <body> 초반에 로드되어 인라인 스크립트의 GroupLastPath.remember()보다 먼저 실행되게 합니다.
 */
(function () {
  var KEY = 'group.lastPath';
  var DEFAULT = '/group/mygroups';

  function isGroupPath(path) {
    if (!path || typeof path !== 'string') return false;
    var p = path.trim();
    if (!p.startsWith('/group/') || p.startsWith('//')) return false;
    var rest = p.slice('/group/'.length).split('/')[0];
    if (!rest) return false;
    if (rest.toLowerCase() === 'mypage.html') return false;
    if (rest.toLowerCase() === 'mypage') return false;
    return /^[a-zA-Z0-9_-]+$/.test(rest);
  }

  function remember(path) {
    try {
      var p = path || (typeof window !== 'undefined' && window.location && window.location.pathname);
      if (p && isGroupPath(p)) localStorage.setItem(KEY, p);
    } catch (_) {}
  }

  function apply() {
    var a = document.getElementById('groupNavLink');
    if (!a) return false;
    try {
      var p = localStorage.getItem(KEY);
      if (p && isGroupPath(p)) a.setAttribute('href', p);
      else a.setAttribute('href', DEFAULT);
    } catch (_) {
      a.setAttribute('href', DEFAULT);
    }
    return true;
  }

  function startObserver() {
    var header = document.getElementById('header');
    if (!header) return;
    if (apply()) return;
    var obs = new MutationObserver(function () {
      if (apply()) obs.disconnect();
    });
    obs.observe(header, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  /** 말씀묵상 등록 후 이동용 ?return= (오픈 리다이렉트 방지, /group/ 하위만) */
  function safeMeditationReturn(raw) {
    if (!raw || typeof raw !== 'string') return null;
    var p = raw.trim();
    try {
      p = decodeURIComponent(p);
    } catch (_) {
      return null;
    }
    if (!p.startsWith('/') || p.startsWith('//')) return null;
    if (p.indexOf('://') !== -1) return null;
    if (p.indexOf('?') !== -1 || p.indexOf('#') !== -1) return null;
    return isGroupPath(p) ? p : null;
  }

  window.GroupLastPath = {
    remember: remember,
    apply: apply,
    isGroupPath: isGroupPath,
    safeMeditationReturn: safeMeditationReturn,
    KEY: KEY,
    DEFAULT: DEFAULT
  };
})();
