/**
 * PJAX: 링크 클릭 시 전체 새로고침 없이 #pjax-container 영역만 교체.
 * 헤더·채팅은 그대로 두고 본문만 바꿔서 깜빡임 감소.
 */
(function() {
  const SKIP_PATHS = ['/login', '/register', '/admin', '/logout'];
  const SKIP_SUFFIX = ['.html', '.pdf', '#'];

  function isPjaxLink(a) {
    if (!a || a.tagName !== 'A' || !a.href) return false;
    if (a.target === '_blank' || a.hasAttribute('data-no-pjax')) return false;
    try {
      const url = new URL(a.href);
      if (url.origin !== window.location.origin) return false;
      const path = url.pathname || '/';
      // 소그룹: 서브내비·스크립트가 많아 PJAX 교체 시 빈 화면/무반응이 나기 쉬움 → 항상 전체 이동
      if (path === '/group' || path.startsWith('/group/')) return false;
      if (SKIP_PATHS.some(p => path === p || path.startsWith(p + '/'))) return false;
      if (SKIP_SUFFIX.some(s => path.endsWith(s))) return false;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
      return true;
    } catch (_) {
      return false;
    }
  }

  function runScripts(container) {
    if (!container) return;
    container.querySelectorAll('script').forEach(function(oldScript) {
      const script = document.createElement('script');
      if (oldScript.src) {
        script.src = oldScript.src;
        script.async = false;
      } else {
        script.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(script, oldScript);
    });
  }

  function ensureStylesFromDoc(doc) {
    const existing = new Set();
    document.head.querySelectorAll('link[rel="stylesheet"][href]').forEach(l => {
      const href = l.getAttribute('href');
      if (href) existing.add(href);
    });
    doc.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (existing.has(href)) return;
      const nl = document.createElement('link');
      nl.rel = 'stylesheet';
      nl.href = href;
      const media = link.getAttribute('media');
      if (media) nl.media = media;
      document.head.appendChild(nl);
      existing.add(href);
    });
  }

  function loadPage(url, pushState) {
    const container = document.getElementById('pjax-container');
    if (!container) return;

    fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function(res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContainer = doc.getElementById('pjax-container');
        const newHeader = doc.getElementById('header');
        if (!newContainer) {
          window.location.href = url;
          return;
        }

        ensureStylesFromDoc(doc);
        container.innerHTML = newContainer.innerHTML;
        runScripts(container);

        const title = doc.querySelector('title');
        if (title) document.title = title.textContent;

        if (newHeader && newHeader.className) {
          const curHeader = document.getElementById('header');
          if (curHeader) curHeader.className = newHeader.className;
        }

        if (newContainer.querySelector('#groupSubNav')) {
          document.body.classList.add('has-group-subnav');
        } else {
          document.body.classList.remove('has-group-subnav');
        }

        if (pushState !== false) {
          try {
            const u = new URL(url, window.location.origin);
            history.pushState({ pjax: true }, '', u.pathname + u.search + u.hash);
          } catch (_) {
            history.pushState({ pjax: true }, '', url);
          }
        }

        window.dispatchEvent(new CustomEvent('pjax:end', { detail: { url: url } }));
      })
      .catch(function() {
        window.location.href = url;
      });
  }

  function init() {
    const container = document.getElementById('pjax-container');
    if (!container) return;

    document.addEventListener('click', function(e) {
      const a = e.target.closest('a[href]');
      if (!isPjaxLink(a)) return;
      e.preventDefault();
      loadPage(a.href, true);
    });

    window.addEventListener('popstate', function(e) {
      if (e.state && e.state.pjax) {
        loadPage(window.location.href, false);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
