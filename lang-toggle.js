/*
 * Standalone language toggle. Tiny fixed link in the top-left corner
 * of every page. Swaps between the EN page and its /zh/ twin.
 *
 * Loaded by every page (landing has its own inline <script> tag;
 * sub-pages load it via appbar.js). Idempotent — won't double-inject.
 */
(function () {
  'use strict';

  function mount() {
    if (document.querySelector('.lang-toggle')) return;
    var here = location.pathname;
    var inZh = here.startsWith('/zh/') || here === '/zh';
    var otherPath = inZh
      ? here.replace(/^\/zh\//, '/').replace(/^\/zh$/, '/')
      : '/zh' + (here === '/' ? '/' : here);
    var a = document.createElement('a');
    a.className = 'lang-toggle';
    a.href = otherPath + location.hash;
    a.setAttribute('aria-label', inZh ? 'Switch to English' : '切换至中文');
    a.setAttribute('hreflang', inZh ? 'en-MY' : 'zh-Hans-MY');
    a.textContent = inZh ? 'EN' : '中';
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
