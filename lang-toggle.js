/*
 * Standalone language toggle. Pill-shaped two-segment switch in the
 * top-left corner of every page. Active language is highlighted; the
 * other is a clickable link to the EN ↔ ZH twin path.
 *
 * Loaded by every page (landing has its own inline <script> tag;
 * sub-pages load it via appbar.js). Idempotent ,  won't double-inject.
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
    var hash = location.hash || '';

    var wrap = document.createElement('div');
    wrap.className = 'lang-toggle';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language');
    wrap.innerHTML = inZh
      ? '<a class="lang-seg" href="' + (otherPath + hash) + '" hreflang="en-MY" aria-label="Switch to English">EN</a>'
        + '<span class="lang-seg lang-seg-active" aria-current="true">中</span>'
      : '<span class="lang-seg lang-seg-active" aria-current="true">EN</span>'
        + '<a class="lang-seg" href="' + (otherPath + hash) + '" hreflang="zh-Hans-MY" aria-label="切换至中文">中</a>';
    document.body.appendChild(wrap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
